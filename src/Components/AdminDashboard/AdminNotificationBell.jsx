'use client';
import { useRef, useState, useEffect } from 'react';
import {
  MdNotifications, MdDoneAll, MdDeleteSweep,
  MdAdd, MdEdit, MdDelete, MdSettings, MdInfo, MdClose,
} from 'react-icons/md';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import './AdminNotificationBell.css';

const TYPE_META = {
  add:    { icon: <MdAdd />,    color: 'anb-green'  },
  edit:   { icon: <MdEdit />,   color: 'anb-blue'   },
  delete: { icon: <MdDelete />, color: 'anb-red'    },
  action: { icon: <MdSettings />, color: 'anb-purple' },
  info:   { icon: <MdInfo />,   color: 'anb-gray'   },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead, removeOne, clearAll } = useAdminNotifications();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const meta = (type) => TYPE_META[type] || TYPE_META.info;

  return (
    <div className="anb-wrapper" ref={ref}>
      <button
        className="anb-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Admin Notifications"
        title="Activity log"
      >
        <MdNotifications className="anb-icon" />
        {unreadCount > 0 && (
          <span className="anb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="anb-dropdown">
          <div className="anb-head">
            <span className="anb-head-title">Activity Log</span>
            <div className="anb-head-actions">
              {unreadCount > 0 && (
                <button className="anb-action-btn" onClick={markAllRead} title="Mark all read">
                  <MdDoneAll />
                </button>
              )}
              {notifications.length > 0 && (
                <button className="anb-action-btn anb-clear" onClick={clearAll} title="Clear all">
                  <MdDeleteSweep />
                </button>
              )}
            </div>
          </div>

          <div className="anb-list">
            {notifications.length === 0 ? (
              <div className="anb-empty">
                <MdNotifications className="anb-empty-icon" />
                <p>No activity yet</p>
                <span>Admin actions will appear here</span>
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => {
                const m = meta(n.type);
                const handleClick = () => {
                  markRead(n.id);
                  if (n.section) {
                    window.dispatchEvent(new CustomEvent('bt:admin_goto', { detail: n.section }));
                    setOpen(false);
                  }
                };
                return (
                  <div
                    key={n.id}
                    className={`anb-item-wrap ${n.is_read ? 'anb-read' : 'anb-unread'}`}
                  >
                    <button
                      className={`anb-item ${n.section ? 'anb-clickable' : ''}`}
                      onClick={handleClick}
                      title={n.section ? `Go to ${n.section}` : undefined}
                    >
                      <span className={`anb-type-dot ${m.color}`}>{m.icon}</span>
                      <div className="anb-item-body">
                        <p className="anb-item-title">{n.title}</p>
                        <p className="anb-item-msg">{n.message}</p>
                        <span className="anb-item-time">{timeAgo(n.created_at)}</span>
                      </div>
                      <div className="anb-item-right">
                        {!n.is_read && <span className="anb-unread-dot" />}
                        {n.section && <span className="anb-goto-arrow">›</span>}
                      </div>
                    </button>
                    <button
                      className="anb-del-btn"
                      onClick={(e) => { e.stopPropagation(); removeOne(n.id); }}
                      title="Remove"
                      aria-label="Remove notification"
                    >
                      <MdClose />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
