import { useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';

import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import { Helmet } from '@unhead/react/helmet';

import ScheduleIcon from '@/material-icons/400-24px/schedule.svg?react';
import { fetchScheduledStatuses } from 'mastodon/actions/scheduled_statuses';
import { Column } from 'mastodon/components/column';
import type { ColumnRef } from 'mastodon/components/column';
import { ColumnHeader } from 'mastodon/components/column_header';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

import { ScheduledStatusCard } from './components/scheduled_status';

const messages = defineMessages({
  heading: {
    id: 'column.scheduled_statuses',
    defaultMessage: 'Scheduled posts',
  },
});

const ScheduledStatuses: FC<{ multiColumn?: boolean }> = ({
  multiColumn = false,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const columnRef = useRef<ColumnRef>(null);

  const statuses = useAppSelector((state) => state.scheduled_statuses.items);
  const isLoading = useAppSelector(
    (state) => state.scheduled_statuses.isLoading,
  );

  useEffect(() => {
    dispatch(fetchScheduledStatuses());
  }, [dispatch]);

  const handleHeaderClick = useCallback(() => {
    columnRef.current?.scrollTop();
  }, []);

  const emptyMessage = (
    <FormattedMessage
      id='empty_column.scheduled_statuses'
      defaultMessage="You don't have any scheduled posts yet. When you schedule one, it will show up here."
    />
  );

  return (
    <Column
      bindToDocument={!multiColumn}
      ref={columnRef}
      label={intl.formatMessage(messages.heading)}
    >
      <ColumnHeader
        icon='schedule'
        iconComponent={ScheduleIcon}
        title={intl.formatMessage(messages.heading)}
        onClick={handleHeaderClick}
        multiColumn={multiColumn}
      />

      <div className='scrollable'>
        {statuses.length === 0 && !isLoading ? (
          <div
            className='empty-column-indicator'
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          statuses.map((status) => (
            <ScheduledStatusCard key={status.id} status={status} />
          ))
        )}
      </div>

      <Helmet>
        <title>{intl.formatMessage(messages.heading)}</title>
        <meta name='robots' content='noindex' />
      </Helmet>
    </Column>
  );
};

// eslint-disable-next-line import/no-default-export
export default ScheduledStatuses;
