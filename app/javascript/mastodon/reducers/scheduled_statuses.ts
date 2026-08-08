import {
  SCHEDULED_STATUSES_FETCH_REQUEST,
  SCHEDULED_STATUSES_FETCH_SUCCESS,
  SCHEDULED_STATUSES_FETCH_FAIL,
  SCHEDULED_STATUS_CANCEL_SUCCESS,
  SCHEDULED_STATUS_UPDATE_SUCCESS,
} from '../actions/scheduled_statuses';
import type {
  ScheduledStatusData,
  ScheduledStatusesAction,
} from '../actions/scheduled_statuses';

export interface ScheduledStatusesState {
  items: ScheduledStatusData[];
  isLoading: boolean;
  error: unknown;
}

const initialState: ScheduledStatusesState = {
  items: [],
  isLoading: false,
  error: null,
};

export function scheduledStatusesReducer(
  state = initialState,
  action: ScheduledStatusesAction,
): ScheduledStatusesState {
  switch (action.type) {
    case SCHEDULED_STATUSES_FETCH_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case SCHEDULED_STATUSES_FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        items: action.statuses,
      };
    case SCHEDULED_STATUSES_FETCH_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    case SCHEDULED_STATUS_CANCEL_SUCCESS:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    case SCHEDULED_STATUS_UPDATE_SUCCESS:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.status.id ? action.status : item,
        ),
      };
    default:
      return state;
  }
}
