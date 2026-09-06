// Single source of truth for the "Right Now" signal.
//
// The status lives in `surge_users.right_now_until` (an ISO timestamp), never
// in the `looking_for` array. Reads happen in the grid, map, cards, profile
// modal, and the Right Now feed — always through this helper so the semantics
// cannot drift.

export function isRightNowActive(user: { right_now_until?: string } | null | undefined): boolean {
  if (!user?.right_now_until) return false;
  const until = new Date(user.right_now_until).getTime();
  return Number.isFinite(until) && until > Date.now();
}

export const RIGHT_NOW_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function rightNowExpiry(): string {
  return new Date(Date.now() + RIGHT_NOW_DURATION_MS).toISOString();
}