import {
  SCHEDULED_STATUSES_FETCH_REQUEST,
  SCHEDULED_STATUSES_FETCH_SUCCESS,
  SCHEDULED_STATUSES_FETCH_FAIL,
  SCHEDULED_STATUSES_EXPAND_REQUEST,
  SCHEDULED_STATUSES_EXPAND_SUCCESS,
  SCHEDULED_STATUSES_EXPAND_FAIL,
  SCHEDULED_STATUS_CANCEL_REQUEST,
  SCHEDULED_STATUS_CANCEL_SUCCESS,
  SCHEDULED_STATUS_CANCEL_FAIL,
  SCHEDULED_STATUS_UPDATE_REQUEST,
  SCHEDULED_STATUS_UPDATE_SUCCESS,
  SCHEDULED_STATUS_UPDATE_FAIL,
} from '../actions/scheduled_statuses';
import type {
  ScheduledStatusData,
  ScheduledStatusesAction,
} from '../actions/scheduled_statuses';

export interface ScheduledStatusesState {
  items: ScheduledStatusData[];
  next: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: unknown;
  pending: Record<string, 'delete' | 'update'>;
}

export const initialScheduledStatusesState: ScheduledStatusesState = {
  items: [],
  next: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  pending: {},
};

const appendUnique = (
  current: ScheduledStatusData[],
  incoming: ScheduledStatusData[],
) => {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !ids.has(item.id))];
};

const withoutPending = (
  pending: ScheduledStatusesState['pending'],
  id: string,
) =>
  Object.fromEntries(
    Object.entries(pending).filter(([pendingId]) => pendingId !== id),
  );

export function scheduledStatusesReducer(
  state = initialScheduledStatusesState,
  action: ScheduledStatusesAction,
): ScheduledStatusesState {
  switch (action.type) {
    case SCHEDULED_STATUSES_FETCH_REQUEST:
      return { ...state, isLoading: true, error: null };
    case SCHEDULED_STATUSES_FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        items: action.statuses,
        next: action.next,
      };
    case SCHEDULED_STATUSES_FETCH_FAIL:
      return { ...state, isLoading: false, error: action.error };
    case SCHEDULED_STATUSES_EXPAND_REQUEST:
      return { ...state, isLoadingMore: true, error: null };
    case SCHEDULED_STATUSES_EXPAND_SUCCESS:
      return {
        ...state,
        isLoadingMore: false,
        items: appendUnique(state.items, action.statuses),
        next: action.next,
      };
    case SCHEDULED_STATUSES_EXPAND_FAIL:
      return { ...state, isLoadingMore: false, error: action.error };
    case SCHEDULED_STATUS_CANCEL_REQUEST:
      return {
        ...state,
        pending: { ...state.pending, [action.id]: 'delete' },
      };
    case SCHEDULED_STATUS_CANCEL_SUCCESS:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
        pending: withoutPending(state.pending, action.id),
      };
    case SCHEDULED_STATUS_CANCEL_FAIL:
      return {
        ...state,
        pending: withoutPending(state.pending, action.id),
      };
    case SCHEDULED_STATUS_UPDATE_REQUEST:
      return {
        ...state,
        pending: { ...state.pending, [action.id]: 'update' },
      };
    case SCHEDULED_STATUS_UPDATE_SUCCESS:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.status.id ? action.status : item,
        ),
        pending: withoutPending(state.pending, action.status.id),
      };
    case SCHEDULED_STATUS_UPDATE_FAIL:
      return {
        ...state,
        pending: withoutPending(state.pending, action.id),
      };
    default:
      return state;
  }
}
