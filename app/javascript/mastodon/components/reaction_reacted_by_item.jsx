import PropTypes from 'prop-types';
import { Avatar } from './avatar';

const getValue = (source, key) => {
  if (typeof source?.get === 'function') {
    return source.get(key);
  }

  return source?.[key];
};

const ReactionReactorListItem = ({
  reactorKey,
  account,
  index,
  onItemClick,
}) => {
  const accountId = getValue(account, 'id');
  const nickname = getValue(account, 'nickname') || accountId;
  const profileUrl = getValue(account, 'profile_url') || '#';
  const avatarUrl = getValue(account, 'avatar_url');
  const isCat = getValue(account, 'isCat') ?? getValue(account, 'is_cat');
  const isExternal = /^https?:\/\//i.test(profileUrl);

  const avatarAccount = {
    id: accountId,
    avatar: avatarUrl,
    avatar_static: avatarUrl,
    is_cat: isCat,
  };

  return (
    <li className='dropdown-menu__item' key={reactorKey ?? index}>
      <a
        href={profileUrl}
        className='reactions-bar__reacted-by__link'
        data-index={index}
        data-hover-card-account={accountId}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onClick={onItemClick}
        target={isExternal ? '_blank' : undefined}
      >
        <Avatar
          account={avatarAccount}
          className='reactions-bar__reacted-by__avatar'
          size={36}
          withLink={false}
        />
        <span className='reactions-bar__reacted-by__name'>{nickname}</span>
      </a>
    </li>
  );
};

ReactionReactorListItem.propTypes = {
  reactorKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  account: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  index: PropTypes.number.isRequired,
  onItemClick: PropTypes.func,
};

export default ReactionReactorListItem;
