import type { ComponentPropsWithoutRef, FC } from 'react';

import classNames from 'classnames';

import type { OnElementHandler } from '../../utils/html';
import { AnimateEmojiProvider } from '../emoji/context';
import { EmojiHTML } from '../emoji/html';
import { Skeleton } from '../skeleton';

import type { DisplayNameProps } from './index';

// Display names commonly sit inside account links. Preserve the contents of
// remote anchor markup without creating invalid, interactive nested links.
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
            htmlString={account.display_name_html}
            as='strong'
            onElement={handleDisplayNameElement}
            extraEmojis={account.emojis}
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
