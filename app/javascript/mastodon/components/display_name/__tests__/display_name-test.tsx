import { IntlProvider } from 'react-intl';

import { MemoryRouter } from 'react-router-dom';

import { render } from '@testing-library/react';

import { accountFactoryState } from '@/testing/factories';

import { LinkedDisplayName } from '../index';

describe('<LinkedDisplayName />', () => {
  it('does not nest a display-name link inside the account link', () => {
    const account = accountFactoryState({
      username: 'alice',
      acct: 'alice',
      display_name: 'Alice',
    });
    account.display_name_html = '<a href="https://example.com">Alice</a>';

    const { container } = render(
      <MemoryRouter>
        <IntlProvider locale='en'>
          <LinkedDisplayName displayProps={{ account }} />
        </IntlProvider>
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('a')).toHaveLength(1);
  });
});
