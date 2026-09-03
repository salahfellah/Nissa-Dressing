'use client';

import { Button } from '@/components/ui';

/**
 * Question d'éligibilité — CDC §3.1.
 *
 * La réponse négative est terminale : le CDC demande un message d'excuse et le
 * blocage de l'inscription, sans retour possible vers le formulaire.
 */
export default function EligibilityStep({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <section className="flex flex-col h-full justify-center fade-in text-center">
      <h1 className="text-2xl font-playfair mb-6 text-brunProfond">Avant de commencer…</h1>
      <p className="text-sm mb-10 leading-relaxed text-brunProfond">
        Nissa Dressing est un espace pensé pour les sœurs, entre sœurs. Une seule question avant de
        vous accueillir, pour préserver la confiance de toutes.
      </p>

      <div className="p-8 rounded-sm mb-10 bg-white border border-sable">
        <h2 className="text-xl font-medium mb-8 text-orDore">Êtes-vous voilée ?</h2>
        <div className="space-y-4">
          <Button onClick={onAccept}>Oui</Button>
          <Button variant="secondary" onClick={onDecline}>
            Non
          </Button>
        </div>
      </div>
    </section>
  );
}
