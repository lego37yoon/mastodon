import { Children } from 'react';
import type { ReactNode } from 'react';

import { act, fireEvent, render, screen } from '@/testing/rendering';
import { SCHEDULED_STATUSES_PRUNE_EXPIRED } from 'mastodon/actions/scheduled_statuses';
import type { ScheduledStatusData } from 'mastodon/actions/scheduled_statuses';
import type { RootState } from 'mastodon/store';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

import ScheduledStatuses from '../index';

vi.mock('mastodon/store', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
  };
});

vi.mock('mastodon/components/scrollable_list', () => ({
  default: ({
    children,
    emptyMessage,
    append,
    hasMore,
    onLoadMore,
  }: {
    children: ReactNode;
    emptyMessage: ReactNode;
    append?: ReactNode;
    hasMore: boolean;
    onLoadMore: () => void;
  }) => (
    <div>
      {children}
      {Children.count(children) === 0 && emptyMessage}
      {append}
      {hasMore && <button onClick={onLoadMore}>Load more</button>}
    </div>
  ),
}));

vi.mock('../components/scheduled_status', () => ({
  ScheduledStatusCard: ({ status }: { status: ScheduledStatusData }) => (
    <div>{status.params.text}</div>
  ),
}));

const status: ScheduledStatusData = {
  id: '1',
  scheduled_at: '2999-01-01T12:30:00.000Z',
  params: { text: 'Scheduled post', visibility: 'public' },
};

describe('<ScheduledStatuses />', () => {
  const dispatch = vi.fn(() => Promise.resolve(true));

  beforeEach(() => {
    dispatch.mockClear();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a retry action after the initial request fails', () => {
    vi.mocked(useAppSelector).mockImplementation(
      (selector: (state: RootState) => unknown) =>
        selector({
          scheduled_statuses: {
            items: [],
            next: null,
            isLoading: false,
            isLoadingMore: false,
            error: new Error('Network error'),
            pending: {},
          },
        } as unknown as RootState),
    );

    render(<ScheduledStatuses />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      screen.getByText('Scheduled posts could not be loaded.'),
    ).not.toBeNull();
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('loads the next page while preserving existing items', () => {
    vi.mocked(useAppSelector).mockImplementation(
      (selector: (state: RootState) => unknown) =>
        selector({
          scheduled_statuses: {
            items: [status],
            next: '/next',
            isLoading: false,
            isLoadingMore: false,
            error: null,
            pending: {},
          },
        } as unknown as RootState),
    );

    render(<ScheduledStatuses />);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(screen.getByText('Scheduled post')).not.toBeNull();
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('removes a status when its scheduled time passes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    const expiringStatus = {
      ...status,
      scheduled_at: '2026-01-01T12:00:01.000Z',
    };

    vi.mocked(useAppSelector).mockImplementation(
      (selector: (state: RootState) => unknown) =>
        selector({
          scheduled_statuses: {
            items: [expiringStatus],
            next: null,
            isLoading: false,
            isLoadingMore: false,
            error: null,
            pending: {},
          },
        } as unknown as RootState),
    );

    render(<ScheduledStatuses />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(dispatch).toHaveBeenLastCalledWith({
      type: SCHEDULED_STATUSES_PRUNE_EXPIRED,
      now: Date.parse(expiringStatus.scheduled_at),
    });
  });
});
