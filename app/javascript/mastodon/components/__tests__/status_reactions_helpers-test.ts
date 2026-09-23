import { fromJS } from 'immutable';

import { toDisplayAccount } from '../status_reactions_helpers';
import type { ReactedByAccount } from '../status_reactions_types';

describe('toDisplayAccount', () => {
  it('creates an account model with direct properties', () => {
    const account = fromJS({
      id: '1',
      username: 'alice',
      acct: 'alice',
      display_name: 'Alice',
      display_name_html: 'Alice',
      url: 'https://example.com/@alice',
      avatar: 'https://example.com/avatar.gif',
      avatar_static: 'https://example.com/avatar.png',
      emojis: [
        {
          shortcode: 'party',
          static_url: 'https://example.com/party.png',
          url: 'https://example.com/party.gif',
          visible_in_picker: true,
        },
      ],
      is_cat: false,
    }) as ReactedByAccount;

    const displayAccount = toDisplayAccount(account);

    expect(displayAccount.display_name_html).toBe('Alice');
    expect(displayAccount.emojis.first()?.shortcode).toBe('party');
    expect(displayAccount.get('display_name_html')).toBe('Alice');
  });
});
