'use client';

import type { OrderStatus } from '@nissa/shared';
import { Check, PackageCheck, Truck } from 'lucide-react';
import { Card } from '@/components/ui';

/** Étapes du suivi — CDC §3.6 (payée → expédiée → reçue). */
const STEPS = [
  { status: 'PAID' as const, label: 'Payée', icon: Check },
  { status: 'SHIPPED' as const, label: 'Expédiée', icon: Truck },
  { status: 'RECEIVED' as const, label: 'Reçue', icon: PackageCheck },
];

const STEP_INDEX: Record<OrderStatus, number> = {
  PENDING_PAYMENT: -1,
  PAID: 0,
  SHIPPED: 1,
  RECEIVED: 2,
  CANCELLED: -1,
  REFUNDED: 2,
};

export default function OrderTimeline({ status }: { status: OrderStatus }) {
  const current = STEP_INDEX[status];
  if (current < 0) return null;

  return (
    <Card className="mb-6">
      <ol className="flex items-start justify-between gap-2">
        {STEPS.map((step, index) => {
          const done = index <= current;
          const Icon = step.icon;
          return (
            <li key={step.status} className="flex-1 text-center relative">
              {index > 0 && (
                <span
                  aria-hidden
                  className={`absolute top-5 right-1/2 w-full h-0.5 ${
                    index <= current ? 'bg-orDore' : 'bg-sable'
                  }`}
                />
              )}
              <span
                className={`relative w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  done ? 'bg-orDore text-white' : 'bg-sable text-taupe'
                }`}
              >
                <Icon size={18} />
              </span>
              <span
                className={`block text-xs uppercase tracking-wider ${
                  done ? 'text-brunProfond font-semibold' : 'text-taupe'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
