import { defineMessages } from 'react-intl';

import { showAlert } from 'mastodon/actions/alerts';
import api, { getLinks } from 'mastodon/api';
import type { AppDispatch, RootState } from 'mastodon/store';

export const SCHEDULED_STATUSES_FETCH_REQUEST =
  'SCHEDULED_STATUSES_FETCH_REQUEST';
export const SCHEDULED_STATUSES_FETCH_SUCCESS =
  'SCHEDULED_STATUSES_FETCH_SUCCESS';
export const SCHEDULED_STATUSES_FETCH_FAIL = 'SCHEDULED_STATUSES_FETCH_FAIL';
export const SCHEDULED_STATUSES_EXPAND_REQUEST =
  'SCHEDULED_STATUSES_EXPAND_REQUEST';
export const SCHEDULED_STATUSES_EXPAND_SUCCESS =
  'SCHEDULED_STATUSES_EXPAND_SUCCESS';
export const SCHEDULED_STATUSES_EXPAND_FAIL = 'SCHEDULED_STATUSES_EXPAND_FAIL';
export const SCHEDULED_STATUS_CANCEL_REQUEST =
  'SCHEDULED_STATUS_CANCEL_REQUEST';
export const SCHEDULED_STATUS_CANCEL_SUCCESS =
  'SCHEDULED_STATUS_CANCEL_SUCCESS';
export const SCHEDULED_STATUS_CANCEL_FAIL = 'SCHEDULED_STATUS_CANCEL_FAIL';
export const SCHEDULED_STATUS_UPDATE_REQUEST =
  'SCHEDULED_STATUS_UPDATE_REQUEST';
export const SCHEDULED_STATUS_UPDATE_SUCCESS =
  'SCHEDULED_STATUS_UPDATE_SUCCESS';
export const SCHEDULED_STATUS_UPDATE_FAIL = 'SCHEDULED_STATUS_UPDATE_FAIL';

const messages = defineMessages({
  cancelSuccess: {
    id: 'scheduled_status.cancel.success',
    defaultMessage: 'Post scheduling canceled.',
  },
  cancelError: {
    id: 'scheduled_status.cancel.error',
    defaultMessage: 'An error occurred while canceling the scheduled post.',
  },
  updateSuccess: {
    id: 'scheduled_status.update.success',
    defaultMessage: 'Scheduled time changed.',
  },
  updateError: {
    id: 'scheduled_status.update.error',
    defaultMessage: 'An error occurred while changing the scheduled time.',
  },
});

export interface ScheduledStatusData {
  id: string;
  scheduled_at: string;
  params: {
    text: string;
    spoiler_text?: string;
    visibility: string;
    sensitive?: boolean;
    language?: string;
    in_reply_to_id?: string;
    quoted_status_id?: string;
    quote_approval_policy?: string;
    media_ids?: string[];
    poll?: {
      options?: string[];
      multiple?: boolean;
      expires_in?: number;
    };
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
      next: string | null;
    }
  | { type: typeof SCHEDULED_STATUSES_FETCH_FAIL; error: unknown }
  | { type: typeof SCHEDULED_STATUSES_EXPAND_REQUEST }
  | {
      type: typeof SCHEDULED_STATUSES_EXPAND_SUCCESS;
      statuses: ScheduledStatusData[];
      next: string | null;
    }
  | { type: typeof SCHEDULED_STATUSES_EXPAND_FAIL; error: unknown }
  | { type: typeof SCHEDULED_STATUS_CANCEL_REQUEST; id: string }
  | { type: typeof SCHEDULED_STATUS_CANCEL_SUCCESS; id: string }
  | { type: typeof SCHEDULED_STATUS_CANCEL_FAIL; id: string }
  | { type: typeof SCHEDULED_STATUS_UPDATE_REQUEST; id: string }
  | {
      type: typeof SCHEDULED_STATUS_UPDATE_SUCCESS;
      status: ScheduledStatusData;
    }
  | { type: typeof SCHEDULED_STATUS_UPDATE_FAIL; id: string };

const getNextLink = (response: Parameters<typeof getLinks>[0]) =>
  getLinks(response).refs.find((link) => link.rel === 'next')?.uri ?? null;

export function fetchScheduledStatuses() {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().scheduled_statuses;
    if (state.isLoading || state.isLoadingMore) return Promise.resolve(false);

    dispatch({ type: SCHEDULED_STATUSES_FETCH_REQUEST });

    return api()
      .get<ScheduledStatusData[]>('/api/v1/scheduled_statuses')
      .then((response) => {
        dispatch({
          type: SCHEDULED_STATUSES_FETCH_SUCCESS,
          statuses: response.data,
          next: getNextLink(response),
        });
        return true;
      })
      .catch((error: unknown) => {
        dispatch({ type: SCHEDULED_STATUSES_FETCH_FAIL, error });
        return false;
      });
  };
}

export function expandScheduledStatuses() {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().scheduled_statuses;
    if (!state.next || state.isLoading || state.isLoadingMore) {
      return Promise.resolve(false);
    }

    dispatch({ type: SCHEDULED_STATUSES_EXPAND_REQUEST });

    return api()
      .get<ScheduledStatusData[]>(state.next)
      .then((response) => {
        dispatch({
          type: SCHEDULED_STATUSES_EXPAND_SUCCESS,
          statuses: response.data,
          next: getNextLink(response),
        });
        return true;
      })
      .catch((error: unknown) => {
        dispatch({ type: SCHEDULED_STATUSES_EXPAND_FAIL, error });
        return false;
      });
  };
}

export function cancelScheduledStatus(id: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().scheduled_statuses.pending[id])
      return Promise.resolve(false);

    dispatch({ type: SCHEDULED_STATUS_CANCEL_REQUEST, id });

    return api()
      .delete(`/api/v1/scheduled_statuses/${id}`)
      .then(() => {
        dispatch({ type: SCHEDULED_STATUS_CANCEL_SUCCESS, id });
        dispatch(showAlert({ message: messages.cancelSuccess }));
        return true;
      })
      .catch(() => {
        dispatch({ type: SCHEDULED_STATUS_CANCEL_FAIL, id });
        dispatch(showAlert({ message: messages.cancelError }));
        return false;
      });
  };
}

export function updateScheduledStatusTime(id: string, scheduledAt: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().scheduled_statuses.pending[id])
      return Promise.resolve(false);

    dispatch({ type: SCHEDULED_STATUS_UPDATE_REQUEST, id });

    return api()
      .put<ScheduledStatusData>(`/api/v1/scheduled_statuses/${id}`, {
        scheduled_at: scheduledAt,
      })
      .then((response) => {
        dispatch({
          type: SCHEDULED_STATUS_UPDATE_SUCCESS,
          status: response.data,
        });
        dispatch(showAlert({ message: messages.updateSuccess }));
        return true;
      })
      .catch(() => {
        dispatch({ type: SCHEDULED_STATUS_UPDATE_FAIL, id });
        dispatch(showAlert({ message: messages.updateError }));
        return false;
      });
  };
}
