'use client';

import { X } from 'lucide-react';
import { RequireStatus } from '@/components/guards';
import StatusShell from '@/components/StatusShell';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function ApplicationRejectedPage() {
  const { logout } = useAuth();

  return (
    <RequireStatus allowed={['REJECTED']}>
      <StatusShell title="Candidature refusée">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-sable text-brunProfond">
          <X size={26} />
        </div>

        <p className="text-sm text-brunProfond leading-relaxed mb-8">
          Après examen, votre demande d’inscription n’a pas pu être retenue par l’administratrice.
          Nous vous prions de bien vouloir nous en excuser, et vous souhaitons le meilleur.
        </p>

        <Button variant="secondary" onClick={() => void logout()}>
          Retour à l’accueil
        </Button>
      </StatusShell>
    </RequireStatus>
  );
}
