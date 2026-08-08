import { useCallback, useId, useMemo, useState } from 'react';
import type { ChangeEvent, FC, FormEvent } from 'react';

import { defineMessages, useIntl } from 'react-intl';

import DeleteIcon from '@/material-icons/400-24px/delete.svg?react';
import EditIcon from '@/material-icons/400-24px/edit.svg?react';
import ScheduleIcon from '@/material-icons/400-24px/schedule.svg?react';
import { openModal } from 'mastodon/actions/modal';
import {
  cancelScheduledStatus,
  updateScheduledStatusTime,
} from 'mastodon/actions/scheduled_statuses';
import type { ScheduledStatusData } from 'mastodon/actions/scheduled_statuses';
import { Button } from 'mastodon/components/button';
import { Icon } from 'mastodon/components/icon';
import {
  getMinimumScheduledDate,
  isScheduledAtValid,
  toLocalDateTimeValue,
} from 'mastodon/features/compose/util/scheduled_at';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

const messages = defineMessages({
  scheduledFor: {
    id: 'scheduled_status.scheduled_for',
    defaultMessage: 'Scheduled for {date}',
  },
  contentWarning: {
    id: 'scheduled_status.content_warning',
    defaultMessage: 'Content warning: {warning}',
  },
  mediaSummary: {
    id: 'scheduled_status.media_summary',
    defaultMessage:
      '{count, plural, one {Includes # media attachment} other {Includes # media attachments}}',
  },
  pollSummary: {
    id: 'scheduled_status.poll_summary',
    defaultMessage:
      '{count, plural, one {Includes a poll with # option} other {Includes a poll with # options}}',
  },
  changeTime: {
    id: 'scheduled_status.change_time',
    defaultMessage: 'Change time',
  },
  changeTimeLabel: {
    id: 'scheduled_status.change_time.label',
    defaultMessage: 'New scheduled date and time',
  },
  changeTimeHint: {
    id: 'scheduled_status.change_time.hint',
    defaultMessage: 'Choose a time more than 5 minutes from now.',
  },
  save: { id: 'scheduled_status.save', defaultMessage: 'Save' },
  close: { id: 'scheduled_status.close', defaultMessage: 'Cancel' },
  cancel: {
    id: 'scheduled_status.cancel',
    defaultMessage: 'Cancel scheduling',
  },
  cancelTitle: {
    id: 'scheduled_status.cancel.title',
    defaultMessage: 'Cancel scheduled post?',
  },
  cancelMessage: {
    id: 'scheduled_status.cancel.message',
    defaultMessage: 'Are you sure you want to cancel this scheduled post?',
  },
});

interface ScheduledStatusProps {
  status: ScheduledStatusData;
}

export const ScheduledStatusCard: FC<ScheduledStatusProps> = ({ status }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const inputId = useId();
  const pending = useAppSelector(
    (state) => state.scheduled_statuses.pending[status.id],
  );
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() =>
    toLocalDateTimeValue(new Date(status.scheduled_at)),
  );
  const [minimumDate, setMinimumDate] = useState('');
  const [validationDate, setValidationDate] = useState<Date>();

  const handleCancel = useCallback(() => {
    dispatch(
      openModal({
        modalType: 'CONFIRM',
        modalProps: {
          title: intl.formatMessage(messages.cancelTitle),
          message: intl.formatMessage(messages.cancelMessage),
          confirm: intl.formatMessage(messages.cancel),
          onConfirm: () => {
            void dispatch(cancelScheduledStatus(status.id));
          },
        },
      }),
    );
  }, [dispatch, intl, status.id]);

  const handleToggleEditTime = useCallback(() => {
    if (!isEditingTime) {
      const now = new Date();
      setValidationDate(now);
      setScheduledAt(toLocalDateTimeValue(new Date(status.scheduled_at)));
      setMinimumDate(toLocalDateTimeValue(getMinimumScheduledDate(now)));
    }

    setIsEditingTime((previous) => !previous);
  }, [isEditingTime, status.scheduled_at]);

  const handleScheduledAtChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setScheduledAt(event.target.value);
    },
    [],
  );

  const handleSaveTime = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!isScheduledAtValid(scheduledAt)) return;

      void dispatch(
        updateScheduledStatusTime(
          status.id,
          new Date(scheduledAt).toISOString(),
        ),
      ).then((success) => {
        if (success) setIsEditingTime(false);
      });
    },
    [dispatch, status.id, scheduledAt],
  );

  const scheduledDate = useMemo(
    () =>
      intl.formatDate(new Date(status.scheduled_at), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [intl, status.scheduled_at],
  );
  const mediaCount = status.media_attachments?.length ?? 0;
  const pollOptionCount = status.params.poll?.options?.length ?? 0;
  const isValid =
    validationDate !== undefined &&
    isScheduledAtValid(scheduledAt, validationDate);
  const isPending = pending !== undefined;

  return (
    <article
      className='status status-direct notification-ungrouped'
      aria-busy={isPending}
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
        <strong>
          {intl.formatMessage(messages.scheduledFor, { date: scheduledDate })}
        </strong>
      </div>

      {status.params.spoiler_text && (
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {intl.formatMessage(messages.contentWarning, {
            warning: status.params.spoiler_text,
          })}
        </div>
      )}

      {status.params.text && (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--color-text-primary)',
          }}
        >
          {status.params.text}
        </div>
      )}

      {(mediaCount > 0 || pollOptionCount > 0) && (
        <div
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
            marginTop: '8px',
          }}
        >
          {mediaCount > 0 && (
            <div>
              {intl.formatMessage(messages.mediaSummary, { count: mediaCount })}
            </div>
          )}
          {pollOptionCount > 0 && (
            <div>
              {intl.formatMessage(messages.pollSummary, {
                count: pollOptionCount,
              })}
            </div>
          )}
        </div>
      )}

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
          <label
            htmlFor={inputId}
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            {intl.formatMessage(messages.changeTimeLabel)}
          </label>
          <input
            id={inputId}
            type='datetime-local'
            value={scheduledAt}
            min={minimumDate}
            onChange={handleScheduledAtChange}
            aria-describedby={`${inputId}-hint`}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-border-primary)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
            required
          />
          <span
            id={`${inputId}-hint`}
            style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}
          >
            {intl.formatMessage(messages.changeTimeHint)}
          </span>
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
              secondary
              compact
              disabled={isPending}
              onClick={handleToggleEditTime}
            >
              {intl.formatMessage(messages.close)}
            </Button>
            <Button
              type='submit'
              compact
              disabled={!isValid || isPending}
              loading={pending === 'update'}
            >
              {intl.formatMessage(messages.save)}
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
        {!isEditingTime && (
          <Button
            onClick={handleToggleEditTime}
            secondary
            compact
            disabled={isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Icon id='edit' icon={EditIcon} style={{ width: 16, height: 16 }} />
            {intl.formatMessage(messages.changeTime)}
          </Button>
        )}
        <Button
          onClick={handleCancel}
          secondary
          compact
          disabled={isPending}
          loading={pending === 'delete'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Icon
            id='delete'
            icon={DeleteIcon}
            style={{ width: 16, height: 16 }}
          />
          {intl.formatMessage(messages.cancel)}
        </Button>
      </div>
    </article>
  );
};
