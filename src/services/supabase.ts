// Supabase compatibility shim — provides the supabase API surface 
// but operations are no-ops or use local state.
// Actual data operations go through Convex hooks in the components.

const noop = () => Promise.resolve({ data: null, error: null });
const noopChain = () => ({
  select: noopChain,
  insert: noopChain,
  update: noopChain,
  upsert: noopChain,
  delete: noopChain,
  eq: noopChain,
  neq: noopChain,
  gt: noopChain,
  lt: noopChain,
  gte: noopChain,
  lte: noopChain,
  order: noopChain,
  limit: noopChain,
  single: noop,
  then: (resolve: any) => resolve({ data: null, error: null, count: 0 }),
});

export const supabase = {
  from: (_table: string) => noopChain(),
  rpc: (_fn: string, _args?: any) => Promise.resolve({ data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signUp: noop,
    signIn: noop,
    signOut: noop,
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: (_bucket: string) => ({
      upload: (_path: string, _file: any, _opts?: any) =>
        Promise.resolve({ data: { path: _path }, error: null }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://placeholder.com/${path}` },
      }),
    }),
  },
  channel: (_name: string) => ({
    on: function() { return this; },
    subscribe: function() { return this; },
  }),
  removeChannel: (_ch: any) => {},
};

export default supabase;
