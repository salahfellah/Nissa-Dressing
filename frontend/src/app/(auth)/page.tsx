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
            {/*
              Citation en Playfair droit : la serif garde la chaleur d'un
              texte écrit, sans l'inclinaison de l'italique, qui durcissait
              la phrase au lieu de l'adoucir.
            */}
            <p className="font-playfair text-lg md:text-xl leading-relaxed mb-7 text-brunProfond">
              « Célébrer la féminité modeste à travers des créations élégantes et intemporelles. »
            </p>
            {/*
              Trois mots posés, non gravés : capitales suivies et barres
              verticales donnaient une plaque de métal. Casse normale et
              points médians dorés, plus discrets.
            */}
            <p className="flex justify-center items-center gap-3 text-sm text-taupe">
              <span>Élégance</span>
              <span aria-hidden className="text-orDore/70">·</span>
              <span>Modestie</span>
              <span aria-hidden className="text-orDore/70">·</span>
              <span>Foi</span>
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
