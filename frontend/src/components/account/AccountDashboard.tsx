'use client';

import { formatPrice, type MemberDashboardDto } from '@nissa/shared';
import { Package, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Tableau de bord de l'espace personnel — CDC §3.2.
 *
 * Des nombres isolés : ce qui est rentré, ce qui est sorti, ce qui est en
 * ligne. Aucun n'a d'historique ni de série à comparer, ils se lisent donc en
 * tuiles et non en graphique — un diagramme à trois barres sans axe du temps
 * demanderait plus d'efforts qu'il n'en épargne.
 *
 * Le chiffre porte la police du texte courant : la Playfair est réservée aux
 * titres, et un montant écrit en serif se lit comme un ornement.
 */

/** Une tuile : ce que la valeur mesure, la valeur, puis ce qui l'explique. */
function Tuile({
  icon: Icon,
  label,
  value,
  detail,
  note,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  detail?: string;
  note?: string;
}) {
  return (
    <div className="bg-white border border-sable rounded-sm p-4">
      <p className="text-xs text-taupe flex items-center gap-1.5">
        <Icon size={14} className="text-orDore shrink-0" />
        {label}
      </p>
      <p className="text-2xl font-medium text-brunProfond mt-2 leading-none">{value}</p>
      {detail && <p className="text-xs text-taupe mt-2">{detail}</p>}
      {note && <p className="text-xs text-orDoreFonce mt-1">{note}</p>}
    </div>
  );
}

const pluriel = (n: number, mot: string): string => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Assemble « a · b · c » en ignorant les morceaux vides. */
const liste = (...morceaux: (string | null)[]): string =>
  morceaux.filter(Boolean).join(' · ');

export default function AccountDashboard() {
  const [data, setData] = useState<MemberDashboardDto | null>(null);

  useEffect(() => {
    api
      .get<MemberDashboardDto>('/account/dashboard')
      .then(setData)
      // Un tableau de bord absent ne doit pas emporter la page du compte :
      // l'adresse et le mot de passe restent modifiables sans lui.
      .catch(() => undefined);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-sable rounded-sm p-4 h-[6.5rem]" />
        ))}
      </div>
    );
  }

  const { sales, purchases, listings, freeBoost } = data;
  const enAttenteDeReversement = sales.payoutCents - sales.transferredCents;

  // La jauge du mois offert : ce qu'il en reste, sur sa durée totale.
  const partRestante = freeBoost
    ? Math.max(0, Math.min(100, (freeBoost.daysLeft / freeBoost.totalDays) * 100))
    : 0;
  // Sous une semaine, le pas foncé de la même gamme marque l'urgence — le
  // décompte en toutes lettres la dit de toute façon, la couleur ne fait que
  // la souligner.
  const bientotFini = !!freeBoost && freeBoost.daysLeft <= 7;

  return (
    <section className="mb-8" aria-label="Votre activité">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tuile
          icon={Package}
          label="Encaissé sur vos ventes"
          value={formatPrice(sales.payoutCents)}
          detail={liste(
            pluriel(sales.count, 'vente'),
            sales.toShip > 0 ? `${sales.toShip} à expédier` : null,
          )}
          note={
            enAttenteDeReversement > 0
              ? `${formatPrice(enAttenteDeReversement)} en attente de reversement`
              : undefined
          }
        />
        <Tuile
          icon={ShoppingBag}
          label="Dépensé en achats"
          value={formatPrice(purchases.spentCents)}
          detail={liste(
            pluriel(purchases.count, 'commande'),
            purchases.toReceive > 0 ? `${purchases.toReceive} à réceptionner` : null,
          )}
        />
        <Tuile
          icon={Tag}
          label="Annonces en ligne"
          value={String(listings.published)}
          detail={
            liste(
              listings.pendingReview > 0 ? `${listings.pendingReview} en modération` : null,
              listings.sold > 0 ? pluriel(listings.sold, 'vendue') : null,
            ) || 'Aucune autre annonce'
          }
          note={
            listings.boosted > 0
              ? `dont ${pluriel(listings.boosted, 'mise')} en avant`
              : undefined
          }
        />
      </div>

      {freeBoost && (
        <div className="bg-white border border-sable rounded-sm p-4 mt-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-xs text-taupe flex items-center gap-1.5">
              <Sparkles size={14} className="text-orDore shrink-0" />
              Mois de mise en avant offert
            </p>
            <p className="text-xs text-taupe">
              jusqu’au {new Date(freeBoost.until).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <p className="text-2xl font-medium text-brunProfond mt-2 leading-none">
            {pluriel(freeBoost.daysLeft, 'jour')} restant{freeBoost.daysLeft > 1 ? 's' : ''}
          </p>
          {/* Piste et remplissage sont deux pas de la même gamme : l'état se lit
              sur toute la barre, pas seulement sur la part colorée. */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={freeBoost.totalDays}
            aria-valuenow={freeBoost.daysLeft}
            aria-label="Jours restants sur votre mois de mise en avant offert"
            className="mt-3 h-1.5 rounded-full bg-orDore/15 overflow-hidden"
          >
            <div
              className={`h-full rounded-full ${bientotFini ? 'bg-orDoreFonce' : 'bg-orDore'}`}
              style={{ width: `${partRestante}%` }}
            />
          </div>
          <p className="text-xs text-taupe mt-2">
            Chaque annonce publiée d’ici là part d’elle-même en tête du catalogue.
          </p>
        </div>
      )}
    </section>
  );
}
