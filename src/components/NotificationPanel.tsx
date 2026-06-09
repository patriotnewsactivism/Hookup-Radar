// src/components/NotificationPanel.tsx
// ─────────────────────────────────────────────────────────────
//  Real-time notification bell + dropdown panel for Surge
//  Drop this into the GridPage header (already has <NotificationBell />)
// ─────────────────────────────────────────────────────────────

import React, { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Bell, Check, MessageCircle, Eye, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  from_user_id?: string;
  entity_id?: string;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  message:      <MessageCircle className="w-4 h-4 text-purple-400" />,
  profile_view: <Eye className="w-4 h-4 text-cyan-400" />,
  nearby:       <MapPin className="w-4 h-4 text-green-400" />,
  event:        <Calendar className="w-4 h-4 text-orange-400" />,
  strike:       <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  ban:          <AlertTriangle className="w-4 h-4 text-red-400" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = (useQuery(api.surgeNotifications.list, { limit: 30 }) ?? []) as Notification[];
  const unread = notifications.filter((n) => !n.is_read).length;

  const markRead    = useMutation(api.surgeNotifications.markRead);
  const markAllRead = useMutation(api.surgeNotifications.markAllRead);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl bg-gray-900/80 border border-white/8 text-gray-400 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-gray-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="text-white font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead({ id: n.id as any })}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
                      !n.is_read ? 'bg-purple-950/30' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${n.is_read ? 'text-gray-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
