import { act, fireEvent, render, screen } from '@/testing/rendering';
import type { ScheduledStatusData } from 'mastodon/actions/scheduled_statuses';
import type { RootState } from 'mastodon/store';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

import { ScheduledStatusCard } from '../scheduled_status';

vi.mock('mastodon/store', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

const status: ScheduledStatusData = {
  id: '1',
  scheduled_at: '2026-01-01T12:30:00.000Z',
  params: {
    text: '',
    visibility: 'public',
    poll: { options: ['One', 'Two'] },
  },
  media_attachments: [
    {
      id: 'media-1',
      type: 'image',
      url: 'https://example.com/image.png',
      preview_url: 'https://example.com/image-preview.png',
    },
  ],
};

describe('<ScheduledStatusCard />', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    dispatch.mockReset();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch as never);
    vi.mocked(useAppSelector).mockImplementation(
      (selector: (state: RootState) => unknown) =>
        selector({
          scheduled_statuses: { pending: {} },
        } as unknown as RootState),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('summarizes media and polls for posts without text', () => {
    render(<ScheduledStatusCard status={status} />);

    expect(screen.getByText('Includes 1 media attachment')).not.toBeNull();
    expect(screen.getByText('Includes a poll with 2 options')).not.toBeNull();
  });

  it('closes the time editor only after a successful update', async () => {
    dispatch.mockReturnValue(Promise.resolve(true));
    render(<ScheduledStatusCard status={status} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change time' }));
    fireEvent.change(screen.getByLabelText('New scheduled date and time'), {
      target: { value: '2026-01-01T12:15' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await Promise.resolve();
    });

    expect(screen.queryByLabelText('New scheduled date and time')).toBeNull();
  });

  it('keeps the time editor open after a failed update', async () => {
    dispatch.mockReturnValue(Promise.resolve(false));
    render(<ScheduledStatusCard status={status} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change time' }));
    fireEvent.change(screen.getByLabelText('New scheduled date and time'), {
      target: { value: '2026-01-01T12:15' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await Promise.resolve();
    });
    expect(dispatch).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('New scheduled date and time')).not.toBeNull();
  });

  it('disables management actions while the item is pending', () => {
    vi.mocked(useAppSelector).mockImplementation(
      (selector: (state: RootState) => unknown) =>
        selector({
          scheduled_statuses: { pending: { '1': 'delete' } },
        } as unknown as RootState),
    );

    render(<ScheduledStatusCard status={status} />);

    expect(
      screen
        .getByRole('button', { name: 'Change time' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', {
          name: /^Cancel scheduling/,
        })
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });
});
