import { List } from 'immutable';
import type { Map as ImmutableMap } from 'immutable';

import type { ApiReactionAccountJSON } from 'mastodon/api_types/accounts';
import type { Account } from 'mastodon/models/account';
import { createAccountFromReactionJSON } from 'mastodon/models/account';

import type {
  ReactedByAccount,
  Reaction,
  Reactions,
} from './status_reactions_types';

type MapLike = ImmutableMap<string, unknown> | Record<string, unknown>;

const hasGet = (value: MapLike): value is ImmutableMap<string, unknown> =>
  'get' in value && typeof value.get === 'function';

const getValue = (map: MapLike, key: string) => {
  if (hasGet(map)) {
    return map.get(key);
  }

  return map[key];
};

export const getString = (map: MapLike, key: string) => {
  const value = getValue(map, key);
  return typeof value === 'string' ? value : undefined;
};

export const getNumber = (map: MapLike, key: string) => {
  const value = getValue(map, key);
  return typeof value === 'number' ? value : 0;
};

export const getBoolean = (map: MapLike, key: string) => {
  const value = getValue(map, key);
  return typeof value === 'boolean' ? value : false;
};

export const getReactionName = (reaction: Reaction) =>
  getString(reaction, 'name') ?? '';

export const getReactionCount = (reaction: Reaction) =>
  getNumber(reaction, 'count');

export const getVisibleReactions = (
  reactions: Reactions,
  numVisible?: number,
) => {
  let visible = reactions
    .filter((reaction) => getReactionCount(reaction) > 0)
    .sort((a, b) => getReactionCount(b) - getReactionCount(a));

  if (typeof numVisible === 'number' && numVisible >= 0) {
    visible = visible.filter((_, index) => index < numVisible);
  }

  return visible.toArray();
};

export const getReactedByList = (reaction: Reaction): ReactedByAccount[] => {
  const reactedBy = reaction.get('reacted_by');

  if (!List.isList(reactedBy)) {
    return [];
  }

  return reactedBy.toArray() as ReactedByAccount[];
};

const toReactionAccountJSON = (
  account: ReactedByAccount,
): ApiReactionAccountJSON =>
  account.toJS() as unknown as ApiReactionAccountJSON;

export const toDisplayAccount = (account: ReactedByAccount): Account =>
  createAccountFromReactionJSON(toReactionAccountJSON(account));
