import { FormattedMessage } from 'react-intl';

import { Link } from 'react-router-dom';

import AddReactionIcon from '@/material-icons/400-24px/add_reaction.svg?react';
import type { NotificationGroupReaction } from 'mastodon/models/notification_group';
import { useAppSelector } from 'mastodon/store';

import type { LabelRenderer } from './notification_group_with_status';
import { NotificationGroupWithStatus } from './notification_group_with_status';

const labelRenderer: LabelRenderer = (displayedName, total, seeMoreHref) => {
  if (total === 1)
    return (
      <FormattedMessage
        id='notification.reaction'
        defaultMessage='{name} reacted to your post'
        values={{ name: displayedName }}
      />
    );

  return (
    <FormattedMessage
      id='notification.reaction.name_and_others_with_link'
      defaultMessage='{name} and <a>{count, plural, one {# other} other {# others}}</a> reacted to your post'
      values={{
        name: displayedName,
        count: total - 1,
        a: (chunks) =>
          seeMoreHref ? <Link to={seeMoreHref}>{chunks}</Link> : chunks,
      }}
    />
  );
};

const privateLabelRenderer: LabelRenderer = (
  displayedName,
  total,
  seeMoreHref,
) => {
  if (total === 1)
    return (
      <FormattedMessage
        id='notification.reaction_pm'
        defaultMessage='{name} reacted to your private mention'
        values={{ name: displayedName }}
      />
    );

  return (
    <FormattedMessage
      id='notification.reaction_pm.name_and_others_with_link'
      defaultMessage='{name} and <a>{count, plural, one {# other} other {# others}}</a> reacted to your private mention'
      values={{
        name: displayedName,
        count: total - 1,
        a: (chunks) =>
          seeMoreHref ? <Link to={seeMoreHref}>{chunks}</Link> : chunks,
      }}
    />
  );
};

export const NotificationReaction: React.FC<{
  notification: NotificationGroupReaction;
  unread: boolean;
}> = ({ notification, unread }) => {
  const { statusId } = notification;

  const isPrivateMention = useAppSelector(
    (state) => state.statuses.getIn([statusId, 'visibility']) === 'direct',
  );

  return (
    <NotificationGroupWithStatus
      type='reaction'
      icon={AddReactionIcon}
      iconId='reaction'
      accountIds={notification.sampleAccountIds}
      statusId={notification.statusId}
      timestamp={notification.latest_page_notification_at}
      count={notification.notifications_count}
      labelRenderer={isPrivateMention ? privateLabelRenderer : labelRenderer}
      unread={unread}
    />
  );
};
