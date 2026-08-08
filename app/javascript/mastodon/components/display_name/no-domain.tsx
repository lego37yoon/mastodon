import type { ComponentPropsWithoutRef, FC } from 'react';

import classNames from 'classnames';

import type { OnElementHandler } from '../../utils/html';
import { AnimateEmojiProvider } from '../emoji/context';
import { EmojiHTML } from '../emoji/html';
import { Skeleton } from '../skeleton';

import type { DisplayNameProps } from './index';

// Display names are often rendered inside a link to the account. Remote
// instances can send display-name HTML containing links, which would otherwise
// produce invalid nested anchors. Keep their contents and styling, but make
// those links non-interactive.
export const handleDisplayNameElement: OnElementHandler = (
  element,
  { href: _, rel: _rel, target: _target, ...props },
  children,
) => {
  if (element instanceof HTMLAnchorElement) {
    return <span {...props}>{children}</span>;
  }

  return undefined;
};

export const DisplayNameWithoutDomain: FC<
  Omit<DisplayNameProps, 'variant'> & ComponentPropsWithoutRef<'span'>
> = ({ account, className, children, localDomain: _, ...props }) => {
  return (
    <AnimateEmojiProvider
      {...props}
      as='span'
      className={classNames('display-name', className)}
    >
      <bdi>
        {account ? (
          <EmojiHTML
            className='display-name__html'
            htmlString={account.get('display_name_html')}
            as='strong'
            onElement={handleDisplayNameElement}
            extraEmojis={account.get('emojis')}
          />
        ) : (
          <strong className='display-name__html'>
            <Skeleton width='10ch' />
          </strong>
        )}
      </bdi>
      {children}
    </AnimateEmojiProvider>
  );
};
