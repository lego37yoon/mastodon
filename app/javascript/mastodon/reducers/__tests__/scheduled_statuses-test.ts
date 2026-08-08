import {
  SCHEDULED_STATUSES_EXPAND_FAIL,
  SCHEDULED_STATUSES_EXPAND_REQUEST,
  SCHEDULED_STATUSES_EXPAND_SUCCESS,
  SCHEDULED_STATUSES_FETCH_SUCCESS,
  SCHEDULED_STATUS_CANCEL_FAIL,
  SCHEDULED_STATUS_CANCEL_REQUEST,
  SCHEDULED_STATUS_CANCEL_SUCCESS,
  SCHEDULED_STATUS_UPDATE_REQUEST,
  SCHEDULED_STATUS_UPDATE_SUCCESS,
} from 'mastodon/actions/scheduled_statuses';
import type { ScheduledStatusData } from 'mastodon/actions/scheduled_statuses';

import {
  initialScheduledStatusesState,
  scheduledStatusesReducer,
} from '../scheduled_statuses';

const scheduledStatus = (
  id: string,
  scheduledAt = '2026-01-01T12:10:00.000Z',
): ScheduledStatusData => ({
  id,
  scheduled_at: scheduledAt,
  params: { text: `Post ${id}`, visibility: 'public' },
});

describe('scheduledStatusesReducer', () => {
  it('stores the first page and next link', () => {
    const state = scheduledStatusesReducer(initialScheduledStatusesState, {
      type: SCHEDULED_STATUSES_FETCH_SUCCESS,
      statuses: [scheduledStatus('1')],
      next: '/api/v1/scheduled_statuses?max_id=1',
    });

    expect(state.items.map(({ id }) => id)).toEqual(['1']);
    expect(state.next).toBe('/api/v1/scheduled_statuses?max_id=1');
    expect(state.isLoading).toBe(false);
  });

  it('merges subsequent pages without duplicate IDs', () => {
    const firstPage = scheduledStatusesReducer(initialScheduledStatusesState, {
      type: SCHEDULED_STATUSES_FETCH_SUCCESS,
      statuses: [scheduledStatus('2'), scheduledStatus('1')],
      next: '/next',
    });
    const state = scheduledStatusesReducer(firstPage, {
      type: SCHEDULED_STATUSES_EXPAND_SUCCESS,
      statuses: [scheduledStatus('1'), scheduledStatus('0')],
      next: null,
    });

    expect(state.items.map(({ id }) => id)).toEqual(['2', '1', '0']);
    expect(state.next).toBeNull();
  });

  it('keeps loaded items and the next link after expansion fails', () => {
    const existing = {
      ...initialScheduledStatusesState,
      items: [scheduledStatus('1')],
      next: '/next',
    };
    const loading = scheduledStatusesReducer(existing, {
      type: SCHEDULED_STATUSES_EXPAND_REQUEST,
    });
    const error = new Error('Network error');
    const state = scheduledStatusesReducer(loading, {
      type: SCHEDULED_STATUSES_EXPAND_FAIL,
      error,
    });

    expect(state.items).toEqual(existing.items);
    expect(state.next).toBe('/next');
    expect(state.error).toBe(error);
    expect(state.isLoadingMore).toBe(false);
  });

  it('tracks cancellation and only removes the item on success', () => {
    const existing = {
      ...initialScheduledStatusesState,
      items: [scheduledStatus('1')],
    };
    const pending = scheduledStatusesReducer(existing, {
      type: SCHEDULED_STATUS_CANCEL_REQUEST,
      id: '1',
    });
    const failed = scheduledStatusesReducer(pending, {
      type: SCHEDULED_STATUS_CANCEL_FAIL,
      id: '1',
    });
    const succeeded = scheduledStatusesReducer(pending, {
      type: SCHEDULED_STATUS_CANCEL_SUCCESS,
      id: '1',
    });

    expect(pending.pending['1']).toBe('delete');
    expect(failed.items).toHaveLength(1);
    expect(failed.pending['1']).toBeUndefined();
    expect(succeeded.items).toHaveLength(0);
  });

  it('tracks time updates and preserves the original after failure', () => {
    const original = scheduledStatus('1');
    const existing = {
      ...initialScheduledStatusesState,
      items: [original],
    };
    const pending = scheduledStatusesReducer(existing, {
      type: SCHEDULED_STATUS_UPDATE_REQUEST,
      id: '1',
    });
    const updated = scheduledStatus('1', '2026-01-01T13:00:00.000Z');
    const succeeded = scheduledStatusesReducer(pending, {
      type: SCHEDULED_STATUS_UPDATE_SUCCESS,
      status: updated,
    });

    expect(pending.pending['1']).toBe('update');
    expect(succeeded.items).toEqual([updated]);
    expect(succeeded.pending['1']).toBeUndefined();
  });
});
