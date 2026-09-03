'use client';

import type { NotificationsResponseDto } from '@nissa/shared';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import NotificationItem from './NotificationItem';

const POLL_MS = 60_000;

/**
 * Cloche de notifications — panneau déroulant sur desktop. Sur mobile, c'est le
 * parent qui affiche un lien vers `/notifications`.
 */
export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsResponseDto | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  // `useRef` exige une valeur initiale explicite : sans elle, le typage React
  // ne peut pas déduire que la référence démarre vide.
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Poll du compteur non lus toutes les 60 s.
  const fetchUnread = useCallback(async () => {
    try {
      const { count } = await api.get<{ count: number }>('/notifications/unread-count');
      setUnread(count);
    } catch {
      // serveur pas joignable
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchUnread]);

  // Chargement au premier clic ou lors de la réouverture.
  const openPanel = useCallback(async () => {
    setOpen((prev) => {
      if (!prev) {
        setLoading(true);
        api
          .get<NotificationsResponseDto>('/notifications')
          .then((res) => {
            setData(res);
            setUnread(res.unreadCount);
          })
          .catch(() => undefined)
          .finally(() => setLoading(false));
      }
      return !prev;
    });
  }, []);

  // Fermeture au clic hors panneau.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    await api.post('/notifications/read-all');
    setData((prev) =>
      prev
        ? { ...prev, events: prev.events.map((e) => ({ ...e, isRead: true })), unreadCount: prev.todos.length }
        : prev,
    );
    setUnread((prev) => Math.max(0, data?.todos.length ?? 0));
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={openPanel}
        className="relative hover:text-orDore transition-colors flex flex-col items-center gap-1"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-orDore text-white text-[0.6rem] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-semibold pointer-events-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <span className="text-[0.7rem]">Notifs</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border border-sable rounded-sm shadow-lg z-50 max-h-[70vh] flex flex-col"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sable shrink-0">
            <span className="font-playfair text-lg text-brunProfond">
              Notifications
            </span>
            <div className="flex items-center gap-3">
              {data && data.events.some((e) => !e.isRead) && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-orDore hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-taupe hover:text-brunProfond underline"
              >
                Tout voir
              </Link>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="overflow-y-auto flex-1">
            {loading && !data && (
              <p className="text-sm text-taupe text-center py-8">Chargement…</p>
            )}

            {data && data.todos.length === 0 && data.events.length === 0 && (
              <p className="text-sm text-taupe text-center py-8">
                Aucune notification pour l'instant.
              </p>
            )}

            {/* — À faire — */}
            {data && data.todos.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-wider text-taupe font-semibold">
                  À faire
                </p>
                {data.todos.slice(0, 5).map((item) => (
                  <NotificationItem key={item.id} item={item} />
                ))}
              </>
            )}

            {/* — Événements — */}
            {data && data.events.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-wider text-taupe font-semibold">
                  Ce qui s'est passé
                </p>
                {data.events.slice(0, 8).map((item) => (
                  <NotificationItem key={item.id} item={item} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}