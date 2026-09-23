import { fromJS } from 'immutable';

import { addReactionRequest } from '../../actions/interactions';
import { toDisplayAccount } from '../../components/status_reactions_helpers';
import statuses from '../statuses';

describe('status reaction accounts', () => {
  it('stores live reaction accounts in the same form as API reactions', () => {
    const state = fromJS({
      'status-1': {
        id: 'status-1',
        reactions: [],
      },
    });
    const account = {
      id: '1',
      username: 'alice',
      acct: 'alice',
      display_name: 'Alice',
      display_name_html: 'Alice',
      url: 'https://example.com/@alice',
      avatar: 'https://example.com/avatar.gif',
      avatar_static: 'https://example.com/avatar.png',
      emojis: [],
      is_cat: false,
    };

    const nextState = statuses(
      state,
      addReactionRequest('status-1', '👍', '', account),
    );
    const storedAccount = nextState.getIn([
      'status-1',
      'reactions',
      0,
      'reacted_by',
      0,
    ]);

    expect(storedAccount.get('display_name_html')).toBe('Alice');
    expect(toDisplayAccount(storedAccount).display_name_html).toBe('Alice');
  });
});
