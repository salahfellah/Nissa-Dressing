'use client';

import { ButtonLink } from '@/components/ui';

/** Message d'excuse imposé par le CDC §3.1, en cas de réponse négative. */
export default function DeclinedStep() {
  return (
    <section className="flex flex-col h-full justify-center fade-in text-center mt-20">
      <h1 className="text-2xl font-playfair mb-4 text-brunProfond">Merci d’être passée</h1>
      <p className="text-sm mb-8 leading-relaxed px-4 text-brunProfond">
        Nissa Dressing est réservée aux femmes musulmanes voilées : c’est ce qui permet de garantir
        la conformité des articles échangés entre sœurs.
        <br />
        <br />
        Nous te remercions sincèrement de ta compréhension, et te souhaitons le meilleur.
      </p>
      <ButtonLink href="/" variant="secondary">
        Retour à l’accueil
      </ButtonLink>
    </section>
  );
}
