import type { ApiReactionAccountJSON } from './accounts';

// See app/serializers/rest/reaction_serializer.rb
export interface ApiReactionJSON {
  name: string;
  count: number;
  me?: boolean;
  url?: string;
  static_url?: string;
  reacted_by: ApiReactionAccountJSON[];
}
