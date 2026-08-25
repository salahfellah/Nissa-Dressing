'use client';

import { RETURN_STATUS_LABELS, type ReturnRequestDto } from '@nissa/shared';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui';
import { downloadUrl } from '@/lib/api';

const VARIANT = {
  REFUNDED: 'success',
  REJECTED: 'danger',
  PENDING_REVIEW: 'warning',
  ACCEPTED: 'warning',
  RETURN_SHIPPED: 'warning',
} as const;

/** Suivi des demandes de retour de la membre — CDC §3.7. */
export default function ReturnsList({ requests }: { requests: ReturnRequestDto[] }) {
  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li
          key={request.id}
          className="border border-sable rounded-sm p-3 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm text-brunProfond font-medium">{request.orderReference}</p>
            <p className="text-xs text-taupe">
              {request.reason} · {new Date(request.createdAt).toLocaleDateString('fr-FR')}
            </p>
            {request.adminNote && (
              <p className="text-xs text-taupe mt-1 italic">« {request.adminNote} »</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={VARIANT[request.status]}>{RETURN_STATUS_LABELS[request.status]}</Badge>

            {['ACCEPTED', 'RETURN_SHIPPED', 'REFUNDED'].includes(request.status) && (
              <a
                href={downloadUrl(`/returns/${request.id}/bordereau`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs inline-flex items-center gap-1 text-orDore underline"
              >
                <Download size={12} />
                Bordereau
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
