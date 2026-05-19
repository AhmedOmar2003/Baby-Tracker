'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bt_admin_notifications';
const MAX_NOTIFICATIONS = 50;

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addAdminNotification({ title, message, type = 'action', section = null }) {
  const list = getStored();
  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,
    section,   // which admin section to navigate to on click
    is_read: false,
    created_at: new Date().toISOString(),
  };
  const updated = [entry, ...list].slice(0, MAX_NOTIFICATIONS);
  persist(updated);
  window.dispatchEvent(new CustomEvent('bt:admin_notification_added'));
  return entry;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  const reload = useCallback(() => {
    setNotifications(getStored());
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener('bt:admin_notification_added', reload);
    return () => window.removeEventListener('bt:admin_notification_added', reload);
  }, [reload]);

  const markRead = useCallback((id) => {
    const updated = getStored().map((n) => (n.id === id ? { ...n, is_read: true } : n));
    persist(updated);
    setNotifications(updated);
  }, []);

  const markAllRead = useCallback(() => {
    const updated = getStored().map((n) => ({ ...n, is_read: true }));
    persist(updated);
    setNotifications(updated);
  }, []);

  const removeOne = useCallback((id) => {
    const updated = getStored().filter((n) => n.id !== id);
    persist(updated);
    setNotifications(updated);
  }, []);

  const clearAll = useCallback(() => {
    persist([]);
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead, removeOne, clearAll };
}
