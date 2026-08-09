import type { FC, ReactNode } from 'react';

import { render, screen } from '@/testing/rendering';

import ModalRoot from '../modal_root';

vi.mock('mastodon/components/modal_root', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../bundle', () => ({
  default: ({
    children,
  }: {
    children: (component: FC<Record<string, unknown>>) => ReactNode;
  }) => {
    const FunctionModal: FC = () => <div>Function modal</div>;
    return children(FunctionModal);
  },
}));

describe('<ModalRoot />', () => {
  it('does not pass a ref to function modals', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      render(
        <ModalRoot
          type='CONFIRM'
          props={{}}
          onClose={vi.fn()}
          ignoreFocus={false}
        />,
      );

      expect(screen.getByText('Function modal')).not.toBeNull();
      expect(
        consoleError.mock.calls.some(([message]) =>
          String(message).includes('Function components cannot be given refs'),
        ),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });
});
