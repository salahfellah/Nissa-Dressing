'use client';

import { Clock } from 'lucide-react';
import { RequireStatus } from '@/components/guards';
import StatusShell from '@/components/StatusShell';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function PendingReviewPage() {
  const { refresh, logout } = useAuth();

  return (
    <RequireStatus allowed={['PENDING_REVIEW']}>
      <StatusShell title="Candidature en cours d’examen">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-sable text-brunProfond">
          <Clock size={26} />
        </div>

        <p className="text-sm text-brunProfond leading-relaxed mb-8">
          Ta demande d’inscription a bien été transmise à l’administratrice, qui écoutera ton
          enregistrement audio. Tu recevras un e-mail dès qu’une décision aura été prise.
        </p>

        <div className="space-y-3">
          <Button variant="secondary" onClick={() => void refresh()}>
            Vérifier où en est ma demande
          </Button>
          <Button variant="ghost" onClick={() => void logout()}>
            Se déconnecter
          </Button>
        </div>
      </StatusShell>
    </RequireStatus>
  );
}
