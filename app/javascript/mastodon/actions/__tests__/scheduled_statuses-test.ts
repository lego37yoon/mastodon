import api from 'mastodon/api';
import type { RootState } from 'mastodon/store';

import {
  cancelScheduledStatus,
  expandScheduledStatuses,
  fetchScheduledStatuses,
  SCHEDULED_STATUSES_EXPAND_FAIL,
  SCHEDULED_STATUSES_EXPAND_REQUEST,
  SCHEDULED_STATUSES_FETCH_REQUEST,
  SCHEDULED_STATUSES_FETCH_SUCCESS,
  SCHEDULED_STATUS_CANCEL_FAIL,
  SCHEDULED_STATUS_CANCEL_REQUEST,
  SCHEDULED_STATUS_DISMISS,
  SCHEDULED_STATUS_UPDATE_REQUEST,
  SCHEDULED_STATUS_UPDATE_SUCCESS,
  updateScheduledStatusTime,
} from '../scheduled_statuses';
import type { ScheduledStatusData } from '../scheduled_statuses';

vi.mock('mastodon/api', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return { ...original, default: vi.fn() };
});

const status: ScheduledStatusData = {
  id: '1',
  scheduled_at: '2026-01-01T12:30:00.000Z',
  params: { text: 'Scheduled', visibility: 'public' },
};

const scheduledState = (
  overrides: Partial<RootState['scheduled_statuses']> = {},
) =>
  ({
    scheduled_statuses: {
      items: [],
      next: null,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      pending: {},
      ...overrides,
    },
  }) as unknown as RootState;

describe('scheduled status actions', () => {
  const dispatch = vi.fn();
  const client = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    dispatch.mockReset();
    client.get.mockReset();
    client.put.mockReset();
    client.delete.mockReset();
    vi.mocked(api).mockReturnValue(client as never);
  });

  it('fetches the first page and extracts the next link', async () => {
    client.get.mockResolvedValue({
      data: [status],
      headers: {
        link: '</api/v1/scheduled_statuses?max_id=1>; rel="next"',
      },
    });

    const result = await fetchScheduledStatuses()(dispatch as never, () =>
      scheduledState(),
    );

    expect(result).toBe(true);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: SCHEDULED_STATUSES_FETCH_REQUEST,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: SCHEDULED_STATUSES_FETCH_SUCCESS,
      statuses: [status],
      next: '/api/v1/scheduled_statuses?max_id=1',
    });
  });

  it('does not start a duplicate list request', async () => {
    const result = await fetchScheduledStatuses()(dispatch as never, () =>
      scheduledState({ isLoading: true }),
    );

    expect(result).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('preserves a failed next-page URL for retry', async () => {
    client.get.mockRejectedValue(new Error('Network error'));
    const result = await expandScheduledStatuses()(dispatch as never, () =>
      scheduledState({ next: '/next', items: [status] }),
    );

    expect(result).toBe(false);
    expect(client.get).toHaveBeenCalledWith('/next');
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: SCHEDULED_STATUSES_EXPAND_REQUEST,
    });
    expect(dispatch.mock.calls[1]?.[0]).toMatchObject({
      type: SCHEDULED_STATUSES_EXPAND_FAIL,
    });
  });

  it('returns false and clears pending state when cancellation fails', async () => {
    client.delete.mockRejectedValue(new Error('Network error'));
    const result = await cancelScheduledStatus('1')(dispatch as never, () =>
      scheduledState(),
    );

    expect(result).toBe(false);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: SCHEDULED_STATUS_CANCEL_REQUEST,
      id: '1',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: SCHEDULED_STATUS_CANCEL_FAIL,
      id: '1',
    });
  });

  it('dismisses a status when cancellation races with publishing', async () => {
    client.delete.mockRejectedValue({ response: { status: 404 } });
    const result = await cancelScheduledStatus('1')(dispatch as never, () =>
      scheduledState(),
    );

    expect(result).toBe(false);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: SCHEDULED_STATUS_CANCEL_REQUEST,
      id: '1',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: SCHEDULED_STATUS_DISMISS,
      id: '1',
    });
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('updates a scheduled time and returns success', async () => {
    const updated = { ...status, scheduled_at: '2026-01-01T13:00:00.000Z' };
    client.put.mockResolvedValue({ data: updated });
    const result = await updateScheduledStatusTime('1', updated.scheduled_at)(
      dispatch as never,
      () => scheduledState(),
    );

    expect(result).toBe(true);
    expect(client.put).toHaveBeenCalledWith('/api/v1/scheduled_statuses/1', {
      scheduled_at: updated.scheduled_at,
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: SCHEDULED_STATUS_UPDATE_REQUEST,
      id: '1',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: SCHEDULED_STATUS_UPDATE_SUCCESS,
      status: updated,
    });
  });

  it('dismisses a status when updating races with publishing', async () => {
    client.put.mockRejectedValue({ response: { status: 404 } });
    const result = await updateScheduledStatusTime(
      '1',
      '2026-01-01T13:00:00.000Z',
    )(dispatch as never, () => scheduledState());

    expect(result).toBe(false);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: SCHEDULED_STATUS_UPDATE_REQUEST,
      id: '1',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: SCHEDULED_STATUS_DISMISS,
      id: '1',
    });
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});
