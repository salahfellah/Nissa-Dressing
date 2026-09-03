'use client';

import type { NotificationsResponseDto } from '@nissa/shared';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Alert, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

/**
 * Page complète des notifications — le « tout voir » de la cloche.
 *
 * Deux sections volontairement distinctes : ce qui attend un geste de la sœur,
 * puis ce qui s'est passé. Mélanger les deux ferait perdre les rappels au
 * milieu de l'historique, alors que ce sont eux qui débloquent une commande.
 */
export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(() => {
    api
      .get<NotificationsResponseDto>('/notifications')
      .then(setData)
      .catch(() => setError('Vos notifications n’ont pas pu être chargées.'));
  }, []);

  useEffect(charger, [charger]);

  const marquerLu = (id: string) =>
    setData((actuel) =>
      actuel
        ? {
            ...actuel,
            events: actuel.events.map((e) => (e.id === id ? { ...e, isRead: true } : e)),
            unreadCount: Math.max(0, actuel.unreadCount - 1),
          }
        : actuel,
    );

  const toutMarquerLu = async () => {
    await api.post('/notifications/read-all').catch(() => undefined);
    setData((actuel) =>
      actuel
        ? {
            ...actuel,
            events: actuel.events.map((e) => ({ ...e, isRead: true })),
            unreadCount: actuel.todos.length,
          }
        : actuel,
    );
  };

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!data) return <Spinner label="Chargement de vos notifications…" />;

  const rienDuTout = data.todos.length === 0 && data.events.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 fade-in">
      <SectionTitle subtitle="Ce qui vous attend, et ce qui s’est passé.">Notifications</SectionTitle>

      {rienDuTout ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="Rien pour le moment"
          description="Vos rappels et l’activité de vos commandes apparaîtront ici."
        />
      ) : (
        <>
          {data.todos.length > 0 && (
            <section className="mb-10">
              <h2 className="font-playfair text-lg text-brunProfond mb-3">
                À faire ({data.todos.length})
              </h2>
              <ul className="bg-white border border-sable rounded-sm divide-y divide-sable">
                {data.todos.map((item) => (
                  <li key={item.id}>
                    <NotificationItem item={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.events.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-3 gap-4">
                <h2 className="font-playfair text-lg text-brunProfond">Activité récente</h2>
                {data.events.some((e) => !e.isRead) && (
                  <button
                    type="button"
                    onClick={toutMarquerLu}
                    className="text-xs text-orDore hover:underline"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>
              <ul className="bg-white border border-sable rounded-sm divide-y divide-sable">
                {data.events.map((item) => (
                  <li key={item.id}>
                    <NotificationItem item={item} onMarkRead={marquerLu} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
