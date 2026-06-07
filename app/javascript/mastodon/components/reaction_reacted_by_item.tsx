import type { Account } from 'mastodon/models/account';

import { Avatar } from './avatar';
import { LinkedDisplayName } from './display_name';

interface ReactionReactorListItemProps {
  reactorKey?: string | number;
  account: Account;
  index: number;
}

export const ReactionReactorListItem = ({
  reactorKey,
  account,
  index,
}: ReactionReactorListItemProps) => {
  return (
    <li className='dropdown-menu__item' key={reactorKey ?? index}>
      <LinkedDisplayName
        displayProps={{ account }}
        className='status__display-name'
      >
        <Avatar
          account={account}
          className='reactions-bar__reacted-by__avatar'
          size={36}
          withLink={false}
        />
      </LinkedDisplayName>
    </li>
  );
};
