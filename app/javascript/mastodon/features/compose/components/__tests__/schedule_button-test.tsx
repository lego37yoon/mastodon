import { IntlProvider } from 'react-intl';

import { fireEvent, render, screen } from '@/testing/rendering';

import { ScheduleButton } from '../schedule_button';

const renderButton = (
  onSchedule = vi.fn(),
  props: Partial<React.ComponentProps<typeof ScheduleButton>> = {},
) => {
  render(
    <IntlProvider locale='en'>
      <ScheduleButton
        disabled={false}
        loading={false}
        label='Post'
        onSchedule={onSchedule}
        {...props}
      />
    </IntlProvider>,
  );

  return onSchedule;
};

describe('<ScheduleButton />', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the scheduling popover and submits an ISO timestamp', () => {
    const onSchedule = renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Schedule post' }));
    const dateInput = screen.getByLabelText('Publishing date and time');
    fireEvent.change(dateInput, { target: { value: '2026-01-01T12:15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(onSchedule).toHaveBeenCalledOnce();
    expect(onSchedule).toHaveBeenCalledWith(
      new Date('2026-01-01T12:15').toISOString(),
    );
  });

  it('does not submit the surrounding compose form', () => {
    const onSchedule = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => {
      event.preventDefault();
    });

    render(
      <IntlProvider locale='en'>
        <form onSubmit={onSubmit}>
          <ScheduleButton
            disabled={false}
            loading={false}
            label='Post'
            onSchedule={onSchedule}
          />
        </form>
      </IntlProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Schedule post' }));
    fireEvent.change(screen.getByLabelText('Publishing date and time'), {
      target: { value: '2026-01-01T12:15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(onSchedule).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not open the scheduling popover when disabled', () => {
    renderButton(vi.fn(), { disabled: true });

    fireEvent.click(screen.getByRole('button', { name: 'Schedule post' }));

    expect(screen.queryByLabelText('Publishing date and time')).toBeNull();
  });
});
