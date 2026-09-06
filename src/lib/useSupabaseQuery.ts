import { useEffect, useRef, useState } from 'react';

const SKIP = 'skip' as const;

// Minimal compatibility shim for the old Convex useQuery(fn, args) pattern:
// returns `undefined` while loading (matches Convex semantics used all over
// this codebase), then the resolved value, or `null` on error. Pass the
// string 'skip' as args to skip fetching (same convention as Convex).
export function useAsyncQuery<T>(
  fn: (args: any) => Promise<T>,
  args: any,
  deps: any[] = [],
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (args === SKIP) {
      setData(undefined);
      return;
    }
    let active = true;
    setData(undefined);
    fnRef.current(args)
      .then((result) => {
        if (active) setData(result as T);
      })
      .catch((err) => {
        console.error('useAsyncQuery error:', err);
        if (active) setData(null as unknown as T);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args === SKIP ? SKIP : JSON.stringify(args), ...deps]);

  return data;
}

// Like useAsyncQuery, but also refetches whenever `refreshToken` changes —
// pair with a realtime subscription that bumps a counter on relevant events.
export function useAsyncQueryWithRefresh<T>(
  fn: (args: any) => Promise<T>,
  args: any,
  refreshToken: number,
): T | undefined {
  return useAsyncQuery(fn, args, [refreshToken]);
}
