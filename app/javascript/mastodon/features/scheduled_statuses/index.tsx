import { useCallback, useEffect, useRef } from 'react';
import type { FC } from 'react';

import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Helmet } from '@unhead/react/helmet';

import ScheduleIcon from '@/material-icons/400-24px/schedule.svg?react';
import {
  expandScheduledStatuses,
  fetchScheduledStatuses,
} from 'mastodon/actions/scheduled_statuses';
import { Button } from 'mastodon/components/button';
import { Column } from 'mastodon/components/column';
import type { ColumnRef } from 'mastodon/components/column';
import { ColumnHeader } from 'mastodon/components/column_header';
import ScrollableList from 'mastodon/components/scrollable_list';
import { useAppDispatch, useAppSelector } from 'mastodon/store';

import { ScheduledStatusCard } from './components/scheduled_status';

const messages = defineMessages({
  heading: {
    id: 'column.scheduled_statuses',
    defaultMessage: 'Scheduled posts',
  },
  loadError: {
    id: 'scheduled_statuses.load_error',
    defaultMessage: 'Scheduled posts could not be loaded.',
  },
  retry: {
    id: 'scheduled_statuses.retry',
    defaultMessage: 'Try again',
  },
});

const ScheduledStatuses: FC<{ multiColumn?: boolean }> = ({
  multiColumn = false,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const columnRef = useRef<ColumnRef>(null);

  const { items, next, isLoading, isLoadingMore, error } = useAppSelector(
    (state) => state.scheduled_statuses,
  );

  useEffect(() => {
    void dispatch(fetchScheduledStatuses());
  }, [dispatch]);

  const handleHeaderClick = useCallback(() => {
    columnRef.current?.scrollTop();
  }, []);

  const handleLoadMore = useCallback(() => {
    void dispatch(expandScheduledStatuses());
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    if (items.length === 0) {
      void dispatch(fetchScheduledStatuses());
    } else {
      void dispatch(expandScheduledStatuses());
    }
  }, [dispatch, items.length]);

  const emptyMessage = (
    <FormattedMessage
      id='empty_column.scheduled_statuses'
      defaultMessage="You don't have any scheduled posts yet. When you schedule one, it will show up here."
    />
  );
  const errorMessage = (
    <div className='empty-column-indicator'>
      <p>{intl.formatMessage(messages.loadError)}</p>
      <Button onClick={handleRetry} compact>
        {intl.formatMessage(messages.retry)}
      </Button>
    </div>
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

      <ScrollableList
        scrollKey='scheduled_statuses'
        onLoadMore={handleLoadMore}
        hasMore={next !== null}
        isLoading={isLoading || isLoadingMore}
        showLoading={isLoading && items.length === 0}
        emptyMessage={error && items.length === 0 ? errorMessage : emptyMessage}
        append={error && items.length > 0 ? errorMessage : undefined}
        trackScroll={!multiColumn}
        bindToDocument={!multiColumn}
      >
        {items.map((status) => (
          <ScheduledStatusCard key={status.id} status={status} />
        ))}
      </ScrollableList>

      <Helmet>
        <title>{intl.formatMessage(messages.heading)}</title>
        <meta name='robots' content='noindex' />
      </Helmet>
    </Column>
  );
};

// eslint-disable-next-line import/no-default-export
export default ScheduledStatuses;
