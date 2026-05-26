# Dashboard Widgets — Group A

**Date:** 2026-05-26  
**Status:** Approved

## Goal

Add four new widgets to the Dashboard page: Notification Bell, My Tasks, Budget Health Bar, and Countdown to Event.

## Scope

Five component/page files + one new server actions file. No DB migrations. No new dependencies.

## Constants

```ts
const EVENT_START = new Date('2026-11-02')
const EVENT_END   = new Date('2026-11-07')
```

Defined at the top of `app/(shared)/dashboard/page.tsx`.

---

## Feature 1 — Notification Bell

### Behavior

- Bell icon in TopBar, right side between role badge and avatar
- Red badge shows unread count; hidden when 0
- Click → dropdown list of up to 20 most recent notifications, newest first
- Click individual notification → marks it `read = true`, badge updates
- "Mark all read" button in dropdown header → marks all unread as read
- Bell icon is solid/filled when unread > 0; outline when all read

### Data

Supabase table `notifications`: `id, user_id, message, read, type, created_at`. No schema change.

Query: `notifications` where `user_id = current_user_id` ordered `created_at desc` limit 20.

### Architecture

**`components/layout/NotificationBell.tsx`** — `'use client'`
- Props: `userId: string`
- Fetches notifications on mount via Supabase browser client
- Local state: `notifications[]`, `open: boolean`
- `markRead(id)` calls server action, updates local state optimistically
- `markAllRead()` calls server action, flips all local to `read = true`
- Dropdown uses `fixed` positioning, closes on outside click (`useEffect` listener)

**`app/(shared)/dashboard/actions.ts`** — new file
- `markNotificationRead(id: string)` — updates `notifications` set `read = true` where `id = id AND user_id = current_user.id`
- `markAllNotificationsRead()` — updates all `read = false` rows for current user

**`components/layout/TopBar.tsx`**
- Add `userId: string` prop
- Import and render `<NotificationBell userId={userId} />` between role badge and avatar

**`components/layout/AppShell.tsx`**
- Pass `user.id` to `<TopBar>` as `userId`

---

## Feature 2 — My Tasks Widget

### Behavior

- Card on dashboard: "My Tasks"
- Lists tasks where `assigned_to = user.id` and `status != 'done'`, ordered by `due_date asc nulls last`, limit 6
- Each row: task title, status badge (`todo` = gold, `in_progress` = blue), due date
- Due date renders red if overdue (< today)
- Empty state: "No tasks assigned to you"
- If more than 6 tasks exist, show "+ N more" text at bottom

### Data

Single query added to `getDashboardStats()`:
```ts
supabase.from('tasks')
  .select('id, title, status, due_date')
  .eq('assigned_to', userId)
  .neq('status', 'done')
  .order('due_date', { ascending: true, nullsFirst: false })
  .limit(6)
```

Also fetch total count to compute "+ N more":
```ts
supabase.from('tasks')
  .select('*', { count: 'exact', head: true })
  .eq('assigned_to', userId)
  .neq('status', 'done')
```

### Architecture

Widget rendered inline in `dashboard/page.tsx` — no new component file needed.

---

## Feature 3 — Budget Health Bar

### Behavior

- Card: "Budget Health"
- Shows: `Rp X received of Rp Y budgeted`
- Progress bar fill = `amount_received / amount_budgeted * 100`
- Bar color:
  - ≥ 80% → green (`bg-emerald-500`)
  - 50–79% → gold (`bg-[#a07020]`)
  - < 50% → red (`bg-red-500`)
- If `amount_budgeted = 0` → show "No budget set" and skip bar

### Data

Single query added to `getDashboardStats()`:
```ts
supabase.from('funds')
  .select('amount_budgeted, amount_received')
```

Sum client-side (same pattern as existing funds page).

### Architecture

Widget rendered inline in `dashboard/page.tsx`. Reuses same `fmt()` IDR formatter from funds page — extract to `lib/format.ts` as a shared utility.

---

## Feature 4 — Countdown to Event

### Behavior

- StatCard: label = "SHB Hub 2026", value = `D-X` (days until `EVENT_START`)
- Before Nov 2, 2026 → shows `D-X` in blue
- Nov 2–7, 2026 → label changes to "Event in Progress", value = day number within event (e.g. "Day 3")
- After Nov 7, 2026 → card not rendered

### Logic

```ts
const today = new Date()
today.setHours(0, 0, 0, 0)

const daysUntil = Math.ceil((EVENT_START.getTime() - today.getTime()) / 86_400_000)
const inProgress = today >= EVENT_START && today <= EVENT_END
const ended = today > EVENT_END
```

### Architecture

Computed at render time in `dashboard/page.tsx`. No additional queries.

---

## Shared Utility

**`lib/format.ts`** — new file  
Extract IDR formatter used across funds, sponsors, reports, merch:

```ts
export function fmtIDR(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}
```

Update all four pages to import from here instead of defining locally.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/format.ts` | New — shared `fmtIDR` utility |
| `components/layout/NotificationBell.tsx` | New — bell + dropdown client component |
| `app/(shared)/dashboard/actions.ts` | New — `markNotificationRead`, `markAllNotificationsRead` |
| `components/layout/TopBar.tsx` | Add `userId` prop, render `NotificationBell` |
| `components/layout/AppShell.tsx` | Pass `user.id` to `TopBar` |
| `app/(shared)/dashboard/page.tsx` | 4 new widgets, funds + tasks queries, event date constants |
| `app/(shared)/funds/page.tsx` | Import `fmtIDR` from `lib/format` |
| `app/(shared)/sponsors/page.tsx` | Import `fmtIDR` from `lib/format` |
| `app/(shared)/admin/reports/page.tsx` | Import `fmtIDR` from `lib/format` |
| `app/(shared)/merch/page.tsx` | Import `fmtIDR` from `lib/format` |

## Out of Scope

- Writing notifications from server actions (bell infrastructure only; notifications populate over time as other features trigger them)
- Real-time notification push / polling
- Tasks detail page or inline task editing
- Editing the event dates without a code change
