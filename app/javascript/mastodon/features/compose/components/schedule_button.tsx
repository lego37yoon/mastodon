import { useCallback, useId, useRef, useState } from 'react';

import { defineMessages, useIntl } from 'react-intl';

import Overlay from 'react-overlays/Overlay';

import ArrowDropDownIcon from '@/material-icons/400-24px/arrow_drop_down.svg?react';
import { BetaBadge } from 'mastodon/components/badge';
import { Button } from 'mastodon/components/button';
import { Icon } from 'mastodon/components/icon';

import {
  getDefaultScheduledDate,
  getMinimumScheduledDate,
  isScheduledAtValid,
  toLocalDateTimeValue,
} from '../util/scheduled_at';

const messages = defineMessages({
  open: {
    id: 'compose_form.schedule.open',
    defaultMessage: 'Schedule post',
  },
  title: {
    id: 'compose_form.schedule.title',
    defaultMessage: 'Schedule post',
  },
  dateTime: {
    id: 'compose_form.schedule.datetime',
    defaultMessage: 'Publishing date and time',
  },
  hint: {
    id: 'compose_form.schedule.hint',
    defaultMessage: 'Choose a time at least 5 minutes from now.',
  },
  submit: {
    id: 'compose_form.schedule.submit',
    defaultMessage: 'Schedule',
  },
});

interface Props {
  disabled: boolean;
  loading: boolean;
  label: string;
  onSchedule: (scheduledAt: string) => void;
}

export const ScheduleButton: React.FC<Props> = ({
  disabled,
  loading,
  label,
  onSchedule,
}) => {
  const intl = useIntl();
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [minimumDate, setMinimumDate] = useState('');
  const [validationDate, setValidationDate] = useState<Date>();

  const isValid =
    validationDate !== undefined &&
    isScheduledAtValid(scheduledAt, validationDate);

  const handleToggle = useCallback(() => {
    if (disabled || loading) return;

    setOpen((previous) => {
      if (!previous) {
        const now = new Date();
        setValidationDate(now);
        setMinimumDate(toLocalDateTimeValue(getMinimumScheduledDate(now)));
        setScheduledAt(toLocalDateTimeValue(getDefaultScheduledDate(now)));
      }

      return !previous;
    });
  }, [disabled, loading]);

  const handleClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isScheduledAtValid(scheduledAt)) return;

      onSchedule(new Date(scheduledAt).toISOString());
      setOpen(false);
    },
    [onSchedule, scheduledAt],
  );

  const handleDateChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((event) => {
    setScheduledAt(event.target.value);
  }, []);

  return (
    <div className='compose-form__split-button'>
      <Button
        type='submit'
        compact
        className='compose-form__publish-button'
        disabled={disabled}
        loading={loading}
      >
        {label}
      </Button>

      <button
        type='button'
        ref={triggerRef}
        className='button button--compact compose-form__schedule-toggle'
        disabled={disabled}
        aria-label={intl.formatMessage(messages.open)}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={handleToggle}
      >
        <Icon id='arrow-drop-down' icon={ArrowDropDownIcon} />
      </button>

      <Overlay
        show={open}
        rootClose
        onHide={handleClose}
        offset={[0, 5]}
        placement='top-end'
        flip
        target={triggerRef}
        popperConfig={{ strategy: 'fixed' }}
      >
        {({ props }) => (
          <div
            {...props}
            id={popoverId}
            className='compose-form__schedule-popover dropdown-animation'
          >
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <strong>{intl.formatMessage(messages.title)}</strong>
                <BetaBadge />
              </div>
              <label htmlFor={`${popoverId}-datetime`}>
                {intl.formatMessage(messages.dateTime)}
              </label>
              <input
                id={`${popoverId}-datetime`}
                type='datetime-local'
                value={scheduledAt}
                min={minimumDate}
                onChange={handleDateChange}
                required
              />
              <span>{intl.formatMessage(messages.hint)}</span>
              <Button type='submit' compact disabled={!isValid}>
                {intl.formatMessage(messages.submit)}
              </Button>
            </form>
          </div>
        )}
      </Overlay>
    </div>
  );
};
