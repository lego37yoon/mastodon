import PropTypes from 'prop-types';
import type { ComponentProps } from 'react';
import { PureComponent, useMemo } from 'react';

import classNames from 'classnames';

import ImmutablePropTypes from 'react-immutable-proptypes';

import { animated, useTransition } from '@react-spring/web';

import MoreHorizIcon from '@/material-icons/400-24px/more_horiz.svg?react';

import { unicodeMapping } from '../features/emoji/emoji_unicode_mapping_light';
import { autoPlayGif, reduceMotion } from '../initial_state';
import { assetHost } from '../utils/config';

import { AnimatedNumber } from './animated_number';
import { Dropdown } from './dropdown_menu';
import { Icon } from './icon';
import { ReactionReactorListItem } from './reaction_reacted_by_item';
import {
  getBoolean,
  getReactedByList,
  getReactionCount,
  getReactionName,
  getString,
  getVisibleReactions,
  toDisplayAccount,
} from './status_reactions_helpers';
import type {
  ReactedByAccount,
  Reaction as ReactionType,
  Reactions,
} from './status_reactions_types';

interface StatusReactionsProps {
  statusId: string;
  reactions: Reactions;
  numVisible?: number;
  addReaction?: (statusId: string, name: string, url: string) => void;
  canReact: boolean;
  removeReaction?: (statusId: string, name: string) => void;
}

const StatusReactions = ({
  statusId,
  reactions,
  numVisible,
  addReaction,
  canReact,
  removeReaction,
}: StatusReactionsProps) => {
  const visibleReactions = useMemo(
    () => getVisibleReactions(reactions, numVisible),
    [numVisible, reactions],
  );

  const transitions = useTransition(visibleReactions, {
    from: {
      scale: 0,
    },
    initial: {
      scale: 1,
    },
    enter: {
      scale: 1,
    },
    leave: {
      scale: 0,
    },
    immediate: reduceMotion,
    keys: visibleReactions.map((reaction) => getReactionName(reaction)),
  });

  return (
    <div
      className={classNames('reactions-bar', {
        'reactions-bar--empty': visibleReactions.length === 0,
      })}
    >
      {transitions(({ scale }, reaction) => (
        <Reaction
          key={getReactionName(reaction)}
          statusId={statusId}
          reaction={reaction}
          style={{ transform: scale.to((s) => `scale(${s})`) }}
          addReaction={addReaction}
          removeReaction={removeReaction}
          canReact={canReact}
        />
      ))}
    </div>
  );
};

StatusReactions.propTypes = {
  statusId: PropTypes.string.isRequired,
  reactions: ImmutablePropTypes.list.isRequired,
  numVisible: PropTypes.number,
  addReaction: PropTypes.func,
  canReact: PropTypes.bool.isRequired,
  removeReaction: PropTypes.func,
};

interface ReactionProps {
  statusId: string;
  reaction: ReactionType;
  addReaction?: (statusId: string, name: string, url: string) => void;
  removeReaction?: (statusId: string, name: string) => void;
  canReact: boolean;
  style?: ComponentProps<typeof animated.button>['style'];
}

interface ReactionState {
  hovered: boolean;
}

class Reaction extends PureComponent<ReactionProps, ReactionState> {
  static propTypes = {
    statusId: PropTypes.string,
    reaction: ImmutablePropTypes.map.isRequired,
    addReaction: PropTypes.func,
    removeReaction: PropTypes.func,
    canReact: PropTypes.bool.isRequired,
    style: PropTypes.object,
  };

  state: ReactionState = {
    hovered: false,
  };

  handleClick = () => {
    const { reaction, statusId, addReaction, removeReaction, canReact } =
      this.props;

    if (!canReact) return;

    if (getBoolean(reaction, 'me') && removeReaction) {
      removeReaction(statusId, getReactionName(reaction));
    } else if (addReaction && !getReactionName(reaction).includes('@')) {
      addReaction(
        statusId,
        getReactionName(reaction),
        getString(reaction, 'url') ?? '',
      );
    }
  };

  handleMouseEnter = () => {
    this.setState({ hovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ hovered: false });
  };

  renderItem = (account: ReactedByAccount, index: number) => {
    const displayAccount = toDisplayAccount(account);

    return (
      <ReactionReactorListItem
        reactorKey={displayAccount.id}
        account={displayAccount}
        index={index}
      />
    );
  };

  render() {
    const { reaction } = this.props;
    const reactedByList = getReactedByList(reaction);
    const hasReactedBy = reactedByList.length > 0;

    return (
      <div
        className={hasReactedBy ? 'reactions-bar__item--container' : undefined}
      >
        <animated.button
          type='button'
          className={classNames(
            'reactions-bar__item',
            'reactions-bar__item--reaction',
            {
              active: getBoolean(reaction, 'me'),
              'reactions-bar__item--with-reacted-by': hasReactedBy,
            },
          )}
          onClick={this.handleClick}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          style={this.props.style}
        >
          <span className='reactions-bar__item__emoji'>
            <Emoji
              hovered={this.state.hovered}
              emoji={getReactionName(reaction)}
              url={getString(reaction, 'url')}
              staticUrl={getString(reaction, 'static_url')}
            />
          </span>
          <span className='reactions-bar__item__count'>
            <AnimatedNumber value={getReactionCount(reaction)} />
          </span>
        </animated.button>

        {hasReactedBy && (
          <Dropdown<ReactedByAccount>
            items={reactedByList}
            forceDropdown
            placement='top'
            offset={[0, 4]}
            scrollable={reactedByList.length > 4}
            renderItem={this.renderItem}
          >
            <button
              type='button'
              className='reactions-bar__item reactions-bar__item--details'
              title='Show reacted users'
              aria-label='Show reacted users'
            >
              <Icon id='ellipsis-h' icon={MoreHorizIcon} />
            </button>
          </Dropdown>
        )}
      </div>
    );
  }
}

interface EmojiProps {
  emoji: string;
  hovered: boolean;
  url?: string;
  staticUrl?: string;
}

class Emoji extends PureComponent<EmojiProps> {
  static propTypes = {
    emoji: PropTypes.string.isRequired,
    hovered: PropTypes.bool.isRequired,
    url: PropTypes.string,
    staticUrl: PropTypes.string,
  };

  render() {
    const { emoji, hovered, url, staticUrl } = this.props;

    if (unicodeMapping[emoji]) {
      const { filename, shortCode } = unicodeMapping[emoji];
      const title = shortCode ? `:${shortCode}:` : '';

      return (
        <img
          draggable='false'
          className='emojione'
          alt={emoji}
          title={title}
          src={`${assetHost}/emoji/${filename}.svg`}
        />
      );
    } else {
      const filename = autoPlayGif || hovered ? url : staticUrl;
      const shortCode = `:${emoji}:`;

      return (
        <img
          draggable='false'
          className='emojione custom-emoji'
          alt={shortCode}
          title={shortCode}
          src={filename ?? ''}
        />
      );
    }
  }
}

export default StatusReactions;
