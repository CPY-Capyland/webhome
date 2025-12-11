import { useEffect, useState } from 'react';

export function useResizeObserver<T extends HTMLElement>() {
  const [entry, setEntry] = useState<ResizeObserverEntry | null>(null);
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setEntry(entry);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node]);

  return { ref: setNode, entry };
}
