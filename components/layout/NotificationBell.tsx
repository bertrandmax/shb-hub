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
