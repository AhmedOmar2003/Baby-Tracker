'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { normalizeStoredUserIds } from '@/lib/userIdentity';

const STORAGE_KEY   = 'bt_notifications';
const MAX_STORED    = 50;
const POLL_INTERVAL = 30_000; // 30 s

/* ── localStorage helpers ── */
function getStored() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function getCurrentUserId() {
  if (typeof window === 'undefined') return null;
  try {
    const { appUserId } = normalizeStoredUserIds();
    return appUserId || localStorage.getItem('Id') || null;
  } catch {
    return null;
  }
}

/* ── Standalone addNotification (local-only, backward-compat) ──
   Used by dose reminders / other local events that don't reach the server. */
export function addNotification({ title, message, type = 'general', link = '/profile' }) {
  const list = getStored();
  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,
    is_read: false,
    link,
    created_at: new Date().toISOString(),
    _local: true,
  };
  const updated = [entry, ...list].slice(0, MAX_STORED);
  persist(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bt:notification_added'));
  }
  return entry;
}

/* ── Hook ── */
export function useNotifications() {
  const [notifications, setNotifications] = useState(() => getStored());
  const userIdRef  = useRef(null);
  const pollRef    = useRef(null);
  const mountedRef = useRef(false);

  /* Merge server list with any local-only items */
  const applyServerList = useCallback((serverList) => {
    setNotifications((prev) => {
      const localOnly = prev.filter((n) => n._local);
      // deduplicate: server is authoritative; append local-only that aren't there yet
      const ids = new Set(serverList.map((n) => n.id));
      const extras = localOnly.filter((n) => !ids.has(n.id));
      const merged = [...serverList, ...extras].slice(0, MAX_STORED);
      persist(merged);
      return merged;
    });
  }, []);

  const fetchFromServer = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      const res = await axios.get('/api/v1/notification/forUser', {
        params: { user_id: userId },
      });
      const rows = res.data?.data?.rows || [];
      applyServerList(rows);
    } catch {
      /* silently keep localStorage data */
    }
  }, [applyServerList]);

  /* Start polling */
  useEffect(() => {
    mountedRef.current = true;
    userIdRef.current  = getCurrentUserId();

    // Immediate local snapshot
    setNotifications(getStored());

    // Fetch from server right away
    fetchFromServer();

    // Poll every 30 s
    pollRef.current = setInterval(fetchFromServer, POLL_INTERVAL);

    // Also respond to local-only additions
    const onLocalAdd = () => setNotifications(getStored());
    window.addEventListener('bt:notification_added', onLocalAdd);

    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
      window.removeEventListener('bt:notification_added', onLocalAdd);
    };
  }, [fetchFromServer]);

  /* ── CRUD ── */
  const markRead = useCallback(async (id) => {
    // Optimistic local update
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      persist(updated);
      return updated;
    });
    const userId = userIdRef.current;
    if (userId) {
      try {
        await axios.put(`/api/v1/notification/markRead/${id}`, {}, {
          params: { user_id: userId },
        });
      } catch {}
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      persist(updated);
      return updated;
    });
    const userId = userIdRef.current;
    if (userId) {
      try {
        await axios.put('/api/v1/notification/markAllRead', {}, {
          params: { user_id: userId },
        });
      } catch {}
    }
  }, []);

  const removeOne = useCallback(async (id) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      persist(updated);
      return updated;
    });
    const userId = userIdRef.current;
    if (userId) {
      try {
        await axios.delete(`/api/v1/notification/byId/${id}`, {
          params: { user_id: userId },
        });
      } catch {}
    }
  }, []);

  const clearAll = useCallback(async () => {
    persist([]);
    setNotifications([]);
    const userId = userIdRef.current;
    if (userId) {
      try {
        await axios.delete('/api/v1/notification/clearAll', {
          params: { user_id: userId },
        });
      } catch {}
    }
  }, []);

  /* Manual refresh (exposed for the bell button) */
  const refresh = useCallback(() => fetchFromServer(), [fetchFromServer]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead, removeOne, clearAll, refresh };
}
