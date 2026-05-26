# Dashboard Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Notification Bell, My Tasks widget, Budget Health Bar, and Countdown to Event to the Dashboard.

**Architecture:** Shared IDR formatter and countdown logic live in `lib/` as pure utilities (testable). The notification bell is a self-contained client component that reads Supabase directly. Dashboard page gains three inline widgets via two new queries added to its existing `getDashboardStats` function.

**Tech Stack:** Next.js 15 App Router, Supabase SSR, Tailwind CSS, Vitest + Testing Library

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `lib/format.ts` | Create | Shared `fmtIDR` currency formatter |
| `lib/event-date.ts` | Create | `getEventCountdown` pure function + event constants |
| `app/(shared)/dashboard/actions.ts` | Create | `markNotificationRead`, `markAllNotificationsRead` server actions |
| `components/layout/NotificationBell.tsx` | Create | Bell icon + dropdown client component |
| `components/layout/TopBar.tsx` | Modify | Add `userId` prop, render `NotificationBell` |
| `components/layout/AppShell.tsx` | Modify | Pass `user.id` to `TopBar` |
| `app/(shared)/dashboard/page.tsx` | Modify | 4 new widgets + funds/tasks queries |
| `app/(shared)/funds/page.tsx` | Modify | Import `fmtIDR` from `lib/format` |
| `app/(shared)/sponsors/page.tsx` | Modify | Import `fmtIDR` from `lib/format` |
| `app/(shared)/admin/reports/page.tsx` | Modify | Import `fmtIDR` from `lib/format` |
| `app/(shared)/merch/page.tsx` | Modify | Import `fmtIDR` from `lib/format` |
| `__tests__/format.test.ts` | Create | Unit tests for `fmtIDR` |
| `__tests__/event-date.test.ts` | Create | Unit tests for `getEventCountdown` |
| `__tests__/app-shell.test.tsx` | Modify | Add Supabase mock for bell |

---

## Task 1: Shared fmtIDR utility

**Files:**
- Create: `lib/format.ts`
- Create: `__tests__/format.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/format.test.ts
import { fmtIDR } from '@/lib/format'

test('fmtIDR formats a positive number with IDR symbol', () => {
  expect(fmtIDR(1_000_000)).toContain('1.000.000')
})

test('fmtIDR returns em dash for null', () => {
  expect(fmtIDR(null)).toBe('—')
})

test('fmtIDR formats zero', () => {
  expect(fmtIDR(0)).toContain('0')
})

test('fmtIDR has no decimal places', () => {
  expect(fmtIDR(1500)).not.toContain(',')
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/format.test.ts
```

Expected: `Cannot find module '@/lib/format'`

- [ ] **Step 3: Create `lib/format.ts`**

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

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/format.test.ts
```

Expected: 4 passed

- [ ] **Step 5: Replace local fmt functions in 4 pages**

In `app/(shared)/funds/page.tsx` — replace lines 20-23:
```ts
import { fmtIDR } from '@/lib/format'
```
Then delete the local `fmt` function and rename all `fmt(` calls to `fmtIDR(`.

In `app/(shared)/sponsors/page.tsx` — replace lines 39-42:
```ts
import { fmtIDR } from '@/lib/format'
```
Then delete the local `fmt` function and rename all `fmt(` calls to `fmtIDR(`.

In `app/(shared)/admin/reports/page.tsx` — replace lines 8-10:
```ts
import { fmtIDR } from '@/lib/format'
```
Then delete the local `fmtMoney` function and rename all `fmtMoney(` calls to `fmtIDR(`.

In `app/(shared)/merch/page.tsx` — replace lines 7-9:
```ts
import { fmtIDR } from '@/lib/format'
```
Then delete the local `fmt` function and rename all `fmt(` calls to `fmtIDR(`.

- [ ] **Step 6: Run full test suite — expect all pass**

```bash
npm test
```

Expected: all existing tests pass

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output (clean)

- [ ] **Step 8: Commit**

```bash
git add lib/format.ts __tests__/format.test.ts \
  app/\(shared\)/funds/page.tsx \
  app/\(shared\)/sponsors/page.tsx \
  app/\(shared\)/admin/reports/page.tsx \
  app/\(shared\)/merch/page.tsx
git commit -m "refactor: extract fmtIDR to lib/format, migrate 4 pages"
```

---

## Task 2: Event countdown logic

**Files:**
- Create: `lib/event-date.ts`
- Create: `__tests__/event-date.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/event-date.test.ts
import { getEventCountdown } from '@/lib/event-date'

test('returns before phase with correct daysUntil on Oct 1', () => {
  expect(getEventCountdown(new Date('2026-10-01'))).toEqual({ phase: 'before', daysUntil: 32 })
})

test('returns before phase D-1 on Nov 1', () => {
  expect(getEventCountdown(new Date('2026-11-01'))).toEqual({ phase: 'before', daysUntil: 1 })
})

test('returns during phase Day 1 on Nov 2', () => {
  expect(getEventCountdown(new Date('2026-11-02'))).toEqual({ phase: 'during', dayNumber: 1 })
})

test('returns during phase Day 6 on Nov 7', () => {
  expect(getEventCountdown(new Date('2026-11-07'))).toEqual({ phase: 'during', dayNumber: 6 })
})

test('returns ended phase on Nov 8', () => {
  expect(getEventCountdown(new Date('2026-11-08'))).toEqual({ phase: 'ended' })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- __tests__/event-date.test.ts
```

Expected: `Cannot find module '@/lib/event-date'`

- [ ] **Step 3: Create `lib/event-date.ts`**

```ts
export const EVENT_START = new Date('2026-11-02T00:00:00')
export const EVENT_END   = new Date('2026-11-07T00:00:00')

export type CountdownState =
  | { phase: 'before'; daysUntil: number }
  | { phase: 'during'; dayNumber: number }
  | { phase: 'ended' }

export function getEventCountdown(today: Date = new Date()): CountdownState {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)

  const start = new Date(EVENT_START)
  start.setHours(0, 0, 0, 0)
  const end = new Date(EVENT_END)
  end.setHours(0, 0, 0, 0)

  if (t > end) return { phase: 'ended' }
  if (t >= start) {
    const dayNumber = Math.floor((t.getTime() - start.getTime()) / 86_400_000) + 1
    return { phase: 'during', dayNumber }
  }
  const daysUntil = Math.ceil((start.getTime() - t.getTime()) / 86_400_000)
  return { phase: 'before', daysUntil }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- __tests__/event-date.test.ts
```

Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add lib/event-date.ts __tests__/event-date.test.ts
git commit -m "feat: add getEventCountdown utility for Nov 2-7 2026 event"
```

---

## Task 3: Notification server actions

**Files:**
- Create: `app/(shared)/dashboard/actions.ts`

No unit test — server actions require Supabase integration and are covered by manual smoke test at the end.

- [ ] **Step 1: Create `app/(shared)/dashboard/actions.ts`**

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser()
  if (!user) return
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id)
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add app/\(shared\)/dashboard/actions.ts
git commit -m "feat: add markNotificationRead and markAllNotificationsRead server actions"
```

---

## Task 4: NotificationBell component

**Files:**
- Create: `components/layout/NotificationBell.tsx`

- [ ] **Step 1: Create `components/layout/NotificationBell.tsx`**

```tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markNotificationRead, markAllNotificationsRead } from '@/app/(shared)/dashboard/actions'

type Notification = {
  id: string
  message: string
  read: boolean
  type: string
  created_at: string
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('id, message, read, type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifications(data) })
  }, [userId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const unread = notifications.filter(n => !n.read).length

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function handleMarkAll() {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-8 h-8 text-white/70 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill={unread > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-[#dde3ef] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dde3ef]">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">Notifications</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[10px] font-mono text-[#1d3fa0] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs font-mono text-slate-400 text-center py-6">No notifications</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-[#dde3ef]">
              {notifications.map(n => (
                <li
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={[
                    'px-4 py-3 text-xs leading-snug',
                    n.read
                      ? 'text-slate-400 cursor-default'
                      : 'text-slate-700 font-medium bg-blue-50/50 cursor-pointer hover:bg-blue-50',
                  ].join(' ')}
                >
                  <p>{n.message}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add components/layout/NotificationBell.tsx
git commit -m "feat: add NotificationBell client component"
```

---

## Task 5: Wire bell into TopBar + AppShell

**Files:**
- Modify: `components/layout/TopBar.tsx`
- Modify: `components/layout/AppShell.tsx`
- Modify: `__tests__/app-shell.test.tsx`

- [ ] **Step 1: Update `components/layout/TopBar.tsx`**

Change the export signature (line 27) from:
```tsx
export function TopBar({ user, onToggle }: { user: AppUser; onToggle?: () => void }) {
```
to:
```tsx
export function TopBar({ user, onToggle, userId }: { user: AppUser; onToggle?: () => void; userId: string }) {
```

Add import at top of file (after the existing import):
```tsx
import { NotificationBell } from './NotificationBell'
```

Inside the header, replace the `<div className="ml-auto flex items-center gap-3">` block with:
```tsx
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:block px-2 py-0.5 rounded-md bg-[#a07020]/30 text-[#fdf3d8] text-[10px] font-mono font-semibold tracking-widest uppercase border border-[#a07020]/40">
          {roleLabel}
        </span>

        <NotificationBell userId={userId} />

        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm font-body hidden sm:block">{user.name}</span>
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-display font-bold tracking-wide">
              {initials(user.name)}
            </span>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Update `components/layout/AppShell.tsx`**

Change the TopBar line from:
```tsx
      <TopBar user={user} onToggle={() => setSidebarOpen(o => !o)} />
```
to:
```tsx
      <TopBar user={user} onToggle={() => setSidebarOpen(o => !o)} userId={user.id} />
```

- [ ] **Step 3: Add Supabase mock to `__tests__/app-shell.test.tsx`**

Add this block at the top of the file, before the existing `vi.mock('next/navigation', ...)` call:

```ts
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}))
```

- [ ] **Step 4: Run tests**

```bash
npm test -- __tests__/app-shell.test.tsx
```

Expected: 2 passed

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 6: Commit**

```bash
git add components/layout/TopBar.tsx components/layout/AppShell.tsx __tests__/app-shell.test.tsx
git commit -m "feat: wire NotificationBell into TopBar via userId prop"
```

---

## Task 6: Dashboard page — all 4 widgets

**Files:**
- Modify: `app/(shared)/dashboard/page.tsx`

- [ ] **Step 1: Add imports at top of `app/(shared)/dashboard/page.tsx`**

Replace the current import block:
```ts
import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
```
with:
```ts
import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { fmtIDR } from '@/lib/format'
import { getEventCountdown } from '@/lib/event-date'
```

- [ ] **Step 2: Update `getDashboardStats` to accept `userId` and add two new queries**

Replace the entire `getDashboardStats` function with:

```ts
async function getDashboardStats(userId: string) {
  const supabase = await createClient()
  const [
    { count: openBlockers },
    { count: pendingRequests },
    { count: pendingBudget },
    { count: totalTasks },
    { count: doneTasks },
    { count: overdueFollowups },
    { data: milestones },
    { data: recentActivity },
    { data: funds },
    { data: myTasks },
    { count: myTasksTotal },
  ] = await Promise.all([
    supabase.from('blockers').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('resource_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('budget_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
    supabase
      .from('sponsors')
      .select('*', { count: 'exact', head: true })
      .lt('next_followup_date', new Date().toISOString().split('T')[0])
      .neq('status', 'declined'),
    supabase.from('event_milestones')
      .select('id, title, date, status, events(name)')
      .eq('status', 'upcoming')
      .order('date', { ascending: true })
      .limit(4),
    supabase.from('activity_log')
      .select('id, action, entity_type, created_at, users(name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('funds').select('amount_budgeted, amount_received'),
    supabase.from('tasks')
      .select('id, title, status, due_date')
      .eq('assigned_to', userId)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(6),
    supabase.from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .neq('status', 'done'),
  ])

  const allFunds = funds ?? []
  const totalBudgeted = allFunds.reduce((sum: number, f: any) => sum + (f.amount_budgeted ?? 0), 0)
  const totalReceived = allFunds.reduce((sum: number, f: any) => sum + (f.amount_received ?? 0), 0)

  return {
    openBlockers:     openBlockers     ?? 0,
    pendingRequests:  pendingRequests  ?? 0,
    pendingBudget:    pendingBudget    ?? 0,
    totalTasks:       totalTasks       ?? 0,
    doneTasks:        doneTasks        ?? 0,
    overdueFollowups: overdueFollowups ?? 0,
    milestones:       milestones       ?? [],
    recentActivity:   recentActivity   ?? [],
    totalBudgeted,
    totalReceived,
    myTasks:          myTasks          ?? [],
    myTasksTotal:     myTasksTotal     ?? 0,
  }
}
```

- [ ] **Step 3: Update `DashboardPage` to pass userId and compute new values**

Change:
```ts
  const stats = await getDashboardStats()
  const taskPct = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0
```
to:
```ts
  const stats = await getDashboardStats(user.id)
  const taskPct    = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0
  const budgetPct  = stats.totalBudgeted > 0 ? Math.round((stats.totalReceived / stats.totalBudgeted) * 100) : 0
  const countdown  = getEventCountdown()
```

- [ ] **Step 4: Add `budgetBarColor` helper inside `DashboardPage` (above the return)**

Add this function before the `return (` statement:

```ts
  function budgetBarColor(pct: number) {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-[#a07020]'
    return 'bg-red-500'
  }
```

- [ ] **Step 5: Add Countdown card — insert after the `<h1>` block, before the stat grid**

Current JSX order in the return:
```tsx
        <div className="animate-fade-up stagger-1">
          <h1 ...>Dashboard</h1>
          <p ...>Overview · SHB Competition Hub</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up stagger-2">
```

Insert between them:
```tsx
        {countdown.phase !== 'ended' && (
          <div className="animate-fade-up stagger-1">
            <StatCard
              label={countdown.phase === 'during' ? 'SHB Hub 2026 — In Progress' : 'SHB Hub 2026'}
              value={countdown.phase === 'during' ? `Day ${countdown.dayNumber}` : `D-${countdown.daysUntil}`}
              accent="blue"
              sub={countdown.phase === 'during' ? 'Nov 2 – Nov 7, 2026' : 'Starts Nov 2, 2026'}
            />
          </div>
        )}
```

- [ ] **Step 6: Add Budget Health Bar — insert after the task progress bar card**

The task progress bar card ends with `</Card>` followed by `</div>`. After that closing div, insert:

```tsx
        {stats.totalBudgeted > 0 && (
          <div className="animate-fade-up stagger-3">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400">Budget Health</p>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {fmtIDR(stats.totalReceived)} of {fmtIDR(stats.totalBudgeted)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${budgetBarColor(budgetPct)}`}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
            </Card>
          </div>
        )}
```

- [ ] **Step 7: Add My Tasks widget — insert after the milestones + activity 2-column grid**

After the closing `</div>` of the `grid grid-cols-1 md:grid-cols-2` section, add:

```tsx
        <div className="animate-fade-up stagger-4">
          <Card>
            <p className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-400 mb-3">
              My Tasks
            </p>
            {stats.myTasks.length === 0 ? (
              <p className="text-sm text-slate-300 font-mono py-4 text-center">No tasks assigned to you.</p>
            ) : (
              <ul className="space-y-2.5">
                {(stats.myTasks as any[]).map((t) => {
                  const overdue = t.due_date && new Date(t.due_date) < new Date()
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{t.title}</p>
                        {t.due_date && (
                          <p className={`text-[10px] font-mono mt-0.5 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                            Due {new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {overdue ? ' · Overdue' : ''}
                          </p>
                        )}
                      </div>
                      <Badge variant={t.status === 'in_progress' ? 'blue' : 'gold'}>
                        {t.status === 'in_progress' ? 'In Progress' : 'To Do'}
                      </Badge>
                    </li>
                  )
                })}
                {stats.myTasksTotal > 6 && (
                  <li className="text-[10px] font-mono text-slate-400 text-right pt-1">
                    +{stats.myTasksTotal - 6} more tasks
                  </li>
                )}
              </ul>
            )}
          </Card>
        </div>
```

- [ ] **Step 8: Run full test suite**

```bash
npm test
```

Expected: all pass

- [ ] **Step 9: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output

- [ ] **Step 10: Commit**

```bash
git add app/\(shared\)/dashboard/page.tsx
git commit -m "feat(dashboard): add countdown, budget health bar, and my tasks widgets"
```

---

## Smoke Test Checklist

After all tasks complete, verify in browser:

- [ ] TopBar shows bell icon between role badge and avatar
- [ ] Bell badge hidden when no unread notifications
- [ ] Bell dropdown opens/closes on click, closes on outside click
- [ ] Dashboard countdown card shows `D-X` (since today < Nov 2, 2026)
- [ ] Budget health bar renders with correct color (red if < 50% funded)
- [ ] My Tasks shows tasks assigned to logged-in user, or empty state
- [ ] Overdue tasks show red date text
- [ ] Four currency pages (funds, sponsors, reports, merch) show `Rp` symbol

---

## Out of Scope

- Writing notifications from other server actions (bell is infrastructure-ready; empty until features trigger notifications)
- Real-time notification push
- Tasks detail page or editing tasks inline
- Changing event dates without a code edit
