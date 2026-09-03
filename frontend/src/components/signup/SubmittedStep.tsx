'use client';

import { formatPrice } from '@nissa/shared';
import { Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { usePlatformSettings } from '@/lib/providers';

/** Confirmation de dépôt de candidature — CDC §3.1. */
export default function SubmittedStep() {
  const settings = usePlatformSettings();

  return (
    <section className="flex flex-col h-full justify-center fade-in text-center mt-20">
      <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-orDore text-white">
        <Check size={30} />
      </div>

      <h1 className="text-2xl font-playfair mb-4 text-brunProfond">Merci, ma sœur !</h1>
      <p className="text-sm mb-6 leading-relaxed text-brunProfond">
        Votre demande nous est bien parvenue. L’administratrice l’examinera avec attention, votre message
        audio compris — cela demande un peu de temps, et c’est ce qui protège la communauté.
      </p>

      <div className="p-4 bg-white rounded-sm mb-8 text-xs text-left border-l-3 border-orDore">
        <p className="font-semibold mb-2 text-brunProfond">Ce qui vous attend</p>
        <p className="text-brunProfond leading-relaxed">
          Vous recevrez un e-mail dès qu’une réponse sera prête. Si votre demande est acceptée, une
          participation unique de <strong>{formatPrice(settings.accessFeeCents)}</strong> vous sera
          demandée : elle vous ouvre l’accès à vie, avec {settings.freeBoostDays} jours de mise en
          avant offerts pour votre première annonce.
        </p>
      </div>

      <ButtonLink href="/" variant="secondary">
        Retour à l’accueil
      </ButtonLink>
    </section>
  );
}
