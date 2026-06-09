# Surge / Hookup-Radar — Improvement Implementation Guide

Three features added. Here's exactly what to do to wire them in.

---

## 1. 🔍 Enhanced Search & Filters

### Files changed
| File | What changed |
|------|-------------|
| `src/hooks/useNearbyUsers.ts` | Added `body_type`, `ethnicity`, `verified_only` to `Filters` interface + client-side filtering |
| `src/components/FilterPanel.tsx` | Added Body Type, Ethnicity, and Verified Only UI sections |

### How to wire in
No extra wiring needed — `FilterPanel` and `useNearbyUsers` already talk to each other through the `filters` prop in `GridPage`. The new filters just work.

**Optional:** Push `body_type` / `ethnicity` / `verified_only` filters server-side in `convex/surgeUsers.ts → getNearby` for better performance at scale:
```ts
if (args.bodyTypes?.length) filtered = filtered.filter(u => args.bodyTypes!.includes(u.body_type));
if (args.ethnicities?.length) filtered = filtered.filter(u => args.ethnicities!.includes(u.ethnicity));
if (args.verifiedOnly) filtered = filtered.filter(u => u.is_verified);
```

---

## 2. 🔔 Notification System

### New files
| File | Purpose |
|------|---------|
| `convex/surgeNotifications.ts` | Backend: list, unreadCount, markRead, markAllRead, create, onNewMessage, onProfileView, onNearbyUser, onNewSpotEvent |
| `src/components/NotificationPanel.tsx` | Frontend: bell icon + dropdown panel |

### Schema change (required first)
In `convex/schema.ts` — the updated file is already written. Run:
```bash
bunx convex dev  # or bun run sync
```
This will push the new `surge_notifications` table.

### Wire NotificationPanel into GridPage
Replace the existing `<NotificationBell />` import in `GridPage.tsx` with:
```tsx
import { NotificationPanel } from '../components/NotificationPanel';
// then in JSX, replace <NotificationBell /> with:
<NotificationPanel />
```

### Trigger notifications from mutations
After sending a message in your messages mutation, add:
```ts
await ctx.runMutation(api.surgeNotifications.onNewMessage, {
  receiver_id:     receiverUser._id.toString(),
  sender_name:     senderUser.display_name,
  sender_id:       senderUser._id.toString(),
  conversation_id: args.conversation_id,
  preview:         args.text.slice(0, 60),
});
```

After `incrementViews` in `surgeUsers.ts`:
```ts
await ctx.runMutation(api.surgeNotifications.onProfileView, {
  profile_owner_id: args.id.toString(),
  viewer_name:      viewerUser.display_name,
  viewer_id:        viewerUser._id.toString(),
});
```

---

## 3. 🛡️ Admin Moderation Dashboard

### New files
| File | Purpose |
|------|---------|
| `convex/surgeModeration.ts` | Backend: listReports, resolveReport, issueStrike, listStrikes, listPendingSpots, reviewSpot, getStats |
| `src/pages/AdminPage.tsx` | Frontend: Overview stats, Reports tab, Spots tab |

### Schema change (required first)
The `surge_strikes` table is in the updated `convex/schema.ts`. Run `bun run sync`.

### Wire AdminPage into the app
In `App.tsx`, add:
```tsx
import { AdminPage } from './pages/AdminPage';
// In AppInner, add a new view condition:
{view === 'admin' && <AdminPage />}
```

In `AppSidebar.tsx` or `BottomNav.tsx`, add an Admin link (show only if `profile?.is_verified`):
```tsx
{profile?.is_verified && (
  <button onClick={() => setView('admin')}>
    🛡️ Admin
  </button>
)}
```

### Who counts as admin?
Currently: any user with `is_verified: true`. To add a proper admin role, add `is_admin: v.optional(v.boolean())` to `surge_users` schema and update the `requireAdmin` helper in `surgeModeration.ts`.

---

## Summary of all schema changes

Two new tables added to `convex/schema.ts`:
- `surge_notifications` — user notification inbox
- `surge_strikes` — admin strikes and bans

Run `bun run sync` (or `bunx convex dev`) to push changes.
