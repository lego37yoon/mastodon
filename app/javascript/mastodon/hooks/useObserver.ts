import { useEffect, useMemo } from 'react';

export function useResizeObserver(callback: ResizeObserverCallback) {
  const observer = useMemo(() => new ResizeObserver(callback), [callback]);

  useEffect(
    () => () => {
      observer.disconnect();
    },
    [observer],
  );

  return observer;
}

export function useMutationObserver(callback: MutationCallback) {
  const observer = useMemo(() => new MutationObserver(callback), [callback]);

  useEffect(
    () => () => {
      observer.disconnect();
    },
    [observer],
  );

  return observer;
}
