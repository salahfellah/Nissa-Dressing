'use client';

import { Check } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';

/** Confirmation après dépôt — CDC §3.3 (« ta demande sera examinée »). */
export default function SubmittedNotice({ onNewListing }: { onNewListing: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center fade-in">
      <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
        <Check size={30} />
      </div>

      <h1 className="text-2xl font-playfair mb-4 text-brunProfond">Merci, ma sœur !</h1>
      <p className="text-sm text-brunProfond leading-relaxed mb-6">
        Ton annonce vient d’être transmise à l’administratrice. Elle la regardera avec attention,
        pour que chaque article proposé reste conforme — c’est ce qui fait la confiance entre nous.
        <br />
        <br />
        Tu recevras un e-mail dès qu’elle sera en ligne, in cha Allah.
      </p>

      <div className="space-y-3">
        <ButtonLink href="/mes-annonces">Voir mes annonces</ButtonLink>
        <Button variant="secondary" onClick={onNewListing}>
          Déposer une autre annonce
        </Button>
      </div>
    </div>
  );
}
