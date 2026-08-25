import type { Metadata } from 'next';
import { GuestOnly } from '@/components/guards';
import { ButtonLink, Logo } from '@/components/ui';

export const metadata: Metadata = { title: 'Bienvenue' };

/** Écran d'accueil (splash) — première impression de la marketplace. */
export default function SplashPage() {
  return (
    <GuestOnly>
      <main className="flex flex-col items-center justify-between min-h-screen p-8 fade-in max-w-md mx-auto">
        <div className="flex-1 flex flex-col justify-center w-full mt-12">
          <Logo size="large" asHeading />

          <div className="mt-12 text-center">
            <p className="text-sm leading-relaxed mb-6 italic text-brunProfond">
              « Célébrer la féminité modeste à travers des créations élégantes et intemporelles. »
            </p>
            <p className="flex justify-center items-center gap-3 text-xs tracking-widest font-semibold text-orDore">
              <span>ÉLÉGANCE</span>
              <span aria-hidden>|</span>
              <span>MODESTIE</span>
              <span aria-hidden>|</span>
              <span>FOI</span>
            </p>
          </div>
        </div>

        <div className="w-full space-y-4 mb-8">
          <ButtonLink href="/connexion" variant="primary">
            Se connecter
          </ButtonLink>
          <ButtonLink href="/inscription" variant="secondary">
            Créer un compte
          </ButtonLink>
          <ButtonLink href="/catalogue" variant="ghost">
            Découvrir le catalogue
          </ButtonLink>
        </div>
      </main>
    </GuestOnly>
  );
}
