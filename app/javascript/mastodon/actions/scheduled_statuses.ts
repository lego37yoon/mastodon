import { fromJS } from 'immutable';

import { showAlert } from 'mastodon/actions/alerts';
import { ensureComposeIsVisible } from 'mastodon/actions/compose';
import { redraft } from 'mastodon/actions/statuses';
import api from 'mastodon/api';
import type { AppDispatch, RootState } from 'mastodon/store';

export const SCHEDULED_STATUSES_FETCH_REQUEST =
  'SCHEDULED_STATUSES_FETCH_REQUEST';
export const SCHEDULED_STATUSES_FETCH_SUCCESS =
  'SCHEDULED_STATUSES_FETCH_SUCCESS';
export const SCHEDULED_STATUSES_FETCH_FAIL = 'SCHEDULED_STATUSES_FETCH_FAIL';
export const SCHEDULED_STATUS_CANCEL_SUCCESS =
  'SCHEDULED_STATUS_CANCEL_SUCCESS';
export const SCHEDULED_STATUS_UPDATE_SUCCESS =
  'SCHEDULED_STATUS_UPDATE_SUCCESS';

export interface ScheduledStatusData {
  id: string;
  scheduled_at: string;
  params: {
    text: string;
    spoiler_text?: string;
    visibility: string;
    media_ids?: string[];
  };
  media_attachments?: {
    id: string;
    type: string;
    url: string;
    preview_url: string;
    description?: string;
  }[];
}

export type ScheduledStatusesAction =
  | { type: typeof SCHEDULED_STATUSES_FETCH_REQUEST }
  | {
      type: typeof SCHEDULED_STATUSES_FETCH_SUCCESS;
      statuses: ScheduledStatusData[];
    }
  | { type: typeof SCHEDULED_STATUSES_FETCH_FAIL; error: unknown }
  | { type: typeof SCHEDULED_STATUS_CANCEL_SUCCESS; id: string }
  | {
      type: typeof SCHEDULED_STATUS_UPDATE_SUCCESS;
      status: ScheduledStatusData;
    };

export function fetchScheduledStatuses() {
  return (dispatch: AppDispatch) => {
    dispatch({ type: SCHEDULED_STATUSES_FETCH_REQUEST });

    api()
      .get<ScheduledStatusData[]>('/api/v1/scheduled_statuses')
      .then((response) => {
        dispatch({
          type: SCHEDULED_STATUSES_FETCH_SUCCESS,
          statuses: response.data,
        });
      })
      .catch((error: unknown) => {
        dispatch({ type: SCHEDULED_STATUSES_FETCH_FAIL, error });
      });
  };
}

export function cancelScheduledStatus(id: string) {
  return (dispatch: AppDispatch) => {
    api()
      .delete('/api/v1/scheduled_statuses/' + id)
      .then(() => {
        dispatch({
          type: SCHEDULED_STATUS_CANCEL_SUCCESS,
          id,
        });
        dispatch(showAlert({ message: '게시물 예약을 취소했습니다.' }));
      })
      .catch(() => {
        dispatch(showAlert({ message: '예약 취소 중 오류가 발생했습니다.' }));
      });
  };
}

export function updateScheduledStatusTime(id: string, scheduledAt: string) {
  return (dispatch: AppDispatch) => {
    api()
      .put<ScheduledStatusData>('/api/v1/scheduled_statuses/' + id, {
        scheduled_at: scheduledAt,
      })
      .then((response) => {
        dispatch({
          type: SCHEDULED_STATUS_UPDATE_SUCCESS,
          status: response.data,
        });
        dispatch(showAlert({ message: '예약 시간을 변경했습니다.' }));
      })
      .catch(() => {
        dispatch(
          showAlert({ message: '예약 시간 변경 중 오류가 발생했습니다.' }),
        );
      });
  };
}

export function editScheduledStatusInCompose(status: ScheduledStatusData) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const immutableStatus = fromJS({
      content: status.params.text,
      spoiler_text: status.params.spoiler_text ?? '',
      visibility: status.params.visibility,
      sensitive: false,
      media_attachments: [],
      mentions: [],
    });

    dispatch(redraft(immutableStatus, status.params.text));
    ensureComposeIsVisible(getState);
    dispatch(cancelScheduledStatus(status.id));
    dispatch(
      showAlert({
        message:
          '예약된 게시물을 작성 창으로 불러왔습니다. 내용 수정 후 다시 전송 또는 예약해 주세요.',
      }),
    );
  };
}
