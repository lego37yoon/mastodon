import type { List as ImmutableList, Map as ImmutableMap } from 'immutable';

export type Reaction = ImmutableMap<string, unknown>;
export type Reactions = ImmutableList<Reaction>;
export type ReactedByAccount = ImmutableMap<string, unknown>;
