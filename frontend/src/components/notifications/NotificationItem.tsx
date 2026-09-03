'use client';

import type { NotificationDto } from '@nissa/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { kindMeta, timeAgo } from './meta';

/**
 * Ligne de notification unique — utilisée dans le panneau (popover) et la page
 * dédiée, pour garantir un rendu cohérent.
 */
export default function NotificationItem({
  item,
  onMarkRead,
}: {
  item: NotificationDto;
  onMarkRead?: (id: string) => void;
}) {
  const router = useRouter();
  const { icon: Icon, label } = kindMeta(item.kind);
  const isEvent = !item.kind.startsWith('TODO_');

  const handleClick = () => {
    if (isEvent && !item.isRead) {
      api.post(`/notifications/${item.id}/read`).catch(() => undefined);
      onMarkRead?.(item.id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const inner = (
    <div className="flex gap-3 items-start">
      <span
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          item.kind.startsWith('TODO_')
            ? 'bg-orDore/15 text-orDore'
            : item.isRead
              ? 'bg-sable/50 text-taupe'
              : 'bg-orDore/15 text-orDore'
        }`}
      >
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm line-clamp-2 ${item.isRead ? 'text-taupe' : 'text-brunProfond font-medium'}`}
        >
          {item.title}
        </p>
        {item.message && (
          <p className="text-xs text-taupe mt-0.5 line-clamp-2">{item.message}</p>
        )}
      </div>
      <span className="shrink-0 text-[0.6rem] text-taupe whitespace-nowrap pt-0.5">
        {item.kind.startsWith('TODO_') ? '' : timeAgo(item.createdAt)}
      </span>
    </div>
  );

  if (item.link) {
    return (
      <Link
        href={item.link}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        className={`block px-4 py-3 transition-colors hover:bg-beigeClair ${
          item.isRead ? '' : 'bg-beigeClair/40'
        }`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`block w-full text-left px-4 py-3 transition-colors hover:bg-beigeClair ${
        item.isRead ? '' : 'bg-beigeClair/40'
      }`}
    >
      {inner}
    </button>
  );
}