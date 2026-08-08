import { useCallback, useState, useMemo } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';

import DeleteIcon from '@/material-icons/400-24px/delete.svg?react';
import EditIcon from '@/material-icons/400-24px/edit.svg?react';
import EditNoteIcon from '@/material-icons/400-24px/edit_note.svg?react';
import ScheduleIcon from '@/material-icons/400-24px/schedule.svg?react';
import { openModal } from 'mastodon/actions/modal';
import {
  cancelScheduledStatus,
  updateScheduledStatusTime,
  editScheduledStatusInCompose,
} from 'mastodon/actions/scheduled_statuses';
import type { ScheduledStatusData } from 'mastodon/actions/scheduled_statuses';
import { Button } from 'mastodon/components/button';
import { Icon } from 'mastodon/components/icon';
import { useAppDispatch } from 'mastodon/store';

const toLocalDateTimeValue = (date: Date) => {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
};

interface ScheduledStatusProps {
  status: ScheduledStatusData;
}

export const ScheduledStatusCard: FC<ScheduledStatusProps> = ({ status }) => {
  const dispatch = useAppDispatch();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() =>
    toLocalDateTimeValue(new Date(status.scheduled_at)),
  );
  const [minDate, setMinDate] = useState('');

  const handleCancel = useCallback(() => {
    dispatch(
      openModal({
        modalType: 'CONFIRM',
        modalProps: {
          title: '예약 취소',
          message: '이 게시물의 예약을 취소하시겠습니까?',
          confirm: '예약 취소',
          onConfirm: () => {
            dispatch(cancelScheduledStatus(status.id));
          },
        },
      }),
    );
  }, [dispatch, status.id]);

  const handleToggleEditTime = useCallback(() => {
    setIsEditingTime((prev) => !prev);
    setScheduledAt(toLocalDateTimeValue(new Date(status.scheduled_at)));
    setMinDate(toLocalDateTimeValue(new Date(Date.now() + 5 * 60 * 1000)));
  }, [status.scheduled_at]);

  const handleScheduledAtChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setScheduledAt(e.target.value);
    },
    [],
  );

  const handleSaveTime = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!scheduledAt) return;

      dispatch(
        updateScheduledStatusTime(
          status.id,
          new Date(scheduledAt).toISOString(),
        ),
      );
      setIsEditingTime(false);
    },
    [dispatch, status.id, scheduledAt],
  );

  const handleFullEdit = useCallback(() => {
    dispatch(
      openModal({
        modalType: 'CONFIRM',
        modalProps: {
          title: '게시글 수정',
          message:
            '예약글을 작성 창으로 불러와 수정하시겠습니까? (기존 예약은 취소되고 작성 창에 내용이 채워집니다)',
          confirm: '수정',
          onConfirm: () => {
            dispatch(editScheduledStatusInCompose(status));
          },
        },
      }),
    );
  }, [dispatch, status]);

  const scheduledDate = useMemo(() => {
    return new Date(status.scheduled_at).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [status.scheduled_at]);

  return (
    <div
      className='status status-direct notification-ungrouped'
      style={{
        borderBottom: '1px solid var(--color-border-primary)',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          marginBottom: '8px',
        }}
      >
        <Icon
          id='schedule'
          icon={ScheduleIcon}
          style={{ width: 16, height: 16 }}
        />
        <span>
          <strong>{scheduledDate}</strong> 발행 예정
        </span>
      </div>

      {status.params.spoiler_text && (
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          CW: {status.params.spoiler_text}
        </div>
      )}

      <div
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'var(--color-text-primary)',
        }}
      >
        {status.params.text}
      </div>

      {isEditingTime && (
        <form
          onSubmit={handleSaveTime}
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label style={{ fontSize: '13px', fontWeight: 500 }}>
            변경할 예약 날짜 및 시간
          </label>
          <input
            type='datetime-local'
            value={scheduledAt}
            min={minDate}
            onChange={handleScheduledAtChange}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-border-primary)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
            required
          />
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              marginTop: '4px',
            }}
          >
            <Button
              type='button'
              className='button--secondary'
              compact
              onClick={handleToggleEditTime}
            >
              취소
            </Button>
            <Button type='submit' compact>
              저장
            </Button>
          </div>
        </form>
      )}

      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <Button
          onClick={handleFullEdit}
          compact
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon
            id='edit_note'
            icon={EditNoteIcon}
            style={{ width: 16, height: 16 }}
          />
          게시글 수정
        </Button>
        <Button
          onClick={handleToggleEditTime}
          className='button--secondary'
          compact
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon id='edit' icon={EditIcon} style={{ width: 16, height: 16 }} />
          시간 변경
        </Button>
        <Button
          onClick={handleCancel}
          className='button--secondary'
          compact
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon
            id='delete'
            icon={DeleteIcon}
            style={{ width: 16, height: 16 }}
          />
          예약 취소
        </Button>
      </div>
    </div>
  );
};
