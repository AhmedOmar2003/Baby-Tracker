'use client';
import { useRef, useState, useEffect } from 'react';
import {
  MdNotifications, MdDoneAll, MdDeleteSweep,
  MdCalendarToday, MdOutlineVaccines, MdInfo, MdClose,
  MdChevronRight, MdRefresh,
} from 'react-icons/md';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import './NotificationBell.css';

const TYPE_ICON = {
  reservation: <MdCalendarToday />,
  dose:        <MdOutlineVaccines />,
  general:     <MdInfo />,
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead, removeOne, clearAll, refresh } = useNotifications();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="nb-wrapper" ref={ref}>
      <button className="nb-btn" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <MdNotifications className="nb-icon" />
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          {/* Header */}
          <div className="nb-head">
            <span className="nb-head-title">
              Notifications
              {notifications.length > 0 && (
                <span className="nb-count">{notifications.length}</span>
              )}
            </span>
            <div className="nb-head-actions">
              <button className="nb-action-btn" onClick={refresh} title="Refresh notifications">
                <MdRefresh />
              </button>
              {unreadCount > 0 && (
                <button className="nb-action-btn" onClick={markAllRead} title="Mark all as read">
                  <MdDoneAll />
                </button>
              )}
              {notifications.length > 0 && (
                <button className="nb-action-btn nb-action-del" onClick={clearAll} title="Clear all notifications">
                  <MdDeleteSweep />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <MdNotifications className="nb-empty-icon" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className={`nb-item-wrap ${n.is_read ? 'nb-read' : 'nb-unread'}`}
                >
                  <Link
                    href={n.link || '/profile'}
                    className="nb-item-link"
                    onClick={() => { markRead(n.id); setOpen(false); }}
                  >
                    <span className={`nb-type-dot nb-type-${n.type}`}>
                      {TYPE_ICON[n.type] || TYPE_ICON.general}
                    </span>
                    <div className="nb-item-body">
                      <p className="nb-item-title">{n.title}</p>
                      <p className="nb-item-msg">{n.message}</p>
                      <span className="nb-item-time">{timeAgo(n.created_at)}</span>
                    </div>
                    <div className="nb-item-right">
                      {!n.is_read && <span className="nb-unread-dot" />}
                      <MdChevronRight className="nb-arrow" />
                    </div>
                  </Link>
                  <button
                    className="nb-del-btn"
                    onClick={(e) => { e.stopPropagation(); removeOne(n.id); }}
                    title="Remove"
                    aria-label="Remove notification"
                  >
                    <MdClose />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
