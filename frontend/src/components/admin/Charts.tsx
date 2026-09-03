'use client';

import { formatPrice, type CountByKeyDto, type DailyActivityDto } from '@nissa/shared';
import { useState } from 'react';

/*
 * Graphiques du back-office, dessinés en SVG sans bibliothèque.
 *
 * Une seule teinte, celle de la charte : sur ces graphiques l'identité est
 * portée par l'axe (le jour, le statut, la catégorie), jamais par la couleur.
 * Multiplier les teintes n'ajouterait aucune information et rendrait bruyant un
 * espace qu'on veut lisible d'un coup d'œil.
 */

const OR = '#c8a96a';
const OR_PALE = '#e3d3b0';

/** Barres verticales, un pas par jour. */
export function DailyBars({ data }: { data: DailyActivityDto[] }) {
  const [survol, setSurvol] = useState<DailyActivityDto | null>(null);

  const max = Math.max(1, ...data.map((d) => d.orders));
  const totalCommandes = data.reduce((s, d) => s + d.orders, 0);
  const totalVolume = data.reduce((s, d) => s + d.gmvCents, 0);

  const jourCourt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-5">
        <p className="font-playfair text-3xl text-brunProfond">{totalCommandes}</p>
        <p className="text-sm text-taupe">
          commande{totalCommandes > 1 ? 's' : ''} sur 30 jours ·{' '}
          <span className="text-brunProfond">{formatPrice(totalVolume)}</span> de volume
        </p>
      </div>

      <div className="relative">
        {/* Hauteur fixe : les barres se comparent entre elles, pas d'axe chiffré. */}
        <div className="flex items-end gap-[2px] h-32" role="img" aria-label={`Commandes par jour sur 30 jours, ${totalCommandes} au total`}>
          {data.map((d) => (
            <div
              key={d.day}
              className="flex-1 h-full flex items-end"
              onMouseEnter={() => setSurvol(d)}
              onMouseLeave={() => setSurvol(null)}
            >
              <div
                className="w-full rounded-t-[4px] transition-colors"
                style={{
                  height: d.orders ? `${Math.max(6, (d.orders / max) * 100)}%` : '2px',
                  backgroundColor: d.orders ? (survol?.day === d.day ? '#b09355' : OR) : OR_PALE,
                }}
                title={`${jourCourt(d.day)} — ${d.orders} commande${d.orders > 1 ? 's' : ''}`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs text-taupe mt-2">
          <span>{data.length ? jourCourt(data[0].day) : ''}</span>
          <span>{data.length ? jourCourt(data[data.length - 1].day) : ''}</span>
        </div>

        {survol && (
          <p className="text-sm text-brunProfond mt-1">
            {jourCourt(survol.day)} — {survol.orders} commande{survol.orders > 1 ? 's' : ''}
            {survol.gmvCents > 0 && <span className="text-taupe"> · {formatPrice(survol.gmvCents)}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

/** Barres horizontales classées, valeur écrite en bout de barre. */
export function RankedBars({
  data,
  libelle,
}: {
  data: CountByKeyDto[];
  libelle: (key: string) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return <p className="text-sm text-taupe">Rien à afficher pour le moment.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.key} className="flex items-center gap-3">
          <span className="text-sm text-brunProfond w-32 shrink-0 truncate">{libelle(d.key)}</span>
          <span className="flex-1 bg-sable/50 rounded-[4px] h-2.5 overflow-hidden">
            <span
              className="block h-full rounded-[4px]"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: OR }}
            />
          </span>
          <span className="text-sm text-brunProfond w-6 text-right tabular-nums">{d.count}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Courbe cumulée sur la période.
 *
 * Une courbe relie ses points : elle affirme qu'il s'est passé quelque chose
 * entre les deux. Sur un décompte journalier creux, cela dessinerait des pentes
 * imaginaires entre deux ventes espacées de dix jours. Le cumul, lui, est
 * continu par nature — il ne redescend jamais et chaque segment dit la vérité :
 * plat quand rien ne se vend, montant quand une commande tombe.
 */
export function CumulativeLine({
  data,
  valeur,
  format,
  titre,
}: {
  data: DailyActivityDto[];
  /** Grandeur cumulée pour un jour donné. */
  valeur: (jour: DailyActivityDto) => number;
  format: (total: number) => string;
  titre: string;
}) {
  const [index, setIndex] = useState<number | null>(null);

  // Cumul progressif : chaque point porte le total depuis le début de période.
  let somme = 0;
  const points = data.map((jour) => {
    somme += valeur(jour);
    return { jour: jour.day, total: somme };
  });

  const max = Math.max(1, somme);
  const L = 600;
  const H = 150;
  const pas = points.length > 1 ? L / (points.length - 1) : L;

  const xy = (i: number, total: number) => [i * pas, H - (total / max) * (H - 12)] as const;
  const trace = points.map((p, i) => xy(i, p.total).join(',')).join(' ');
  const aire = `0,${H} ${trace} ${(points.length - 1) * pas},${H}`;

  const actif = index !== null ? points[index] : null;
  const jourCourt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 mb-4">
        <p className="font-playfair text-2xl text-brunProfond">{format(somme)}</p>
        <p className="text-sm text-taupe">{titre}</p>
      </div>

      <div
        className="relative"
        onMouseLeave={() => setIndex(null)}
        onMouseMove={(event) => {
          const boite = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - boite.left) / boite.width;
          setIndex(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
        }}
      >
        <svg
          viewBox={`0 0 ${L} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-36 block"
          role="img"
          aria-label={`${titre} : ${format(somme)} au total`}
        >
          {/* Repères horizontaux, volontairement effacés. */}
          {[0.5, 1].map((r) => (
            <line key={r} x1="0" x2={L} y1={H - r * (H - 12)} y2={H - r * (H - 12)}
                  stroke="#e8e1d6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}

          <polygon points={aire} fill={OR} opacity="0.12" />
          <polyline
            points={trace}
            fill="none"
            stroke={OR}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {actif && index !== null && (
            <>
              <line
                x1={xy(index, actif.total)[0]} x2={xy(index, actif.total)[0]}
                y1="0" y2={H}
                stroke="#b8ada0" strokeWidth="1" vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={xy(index, actif.total)[0]} cy={xy(index, actif.total)[1]}
                r="5" fill={OR} stroke="#ffffff" strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>

        <div className="flex justify-between text-xs text-taupe mt-2">
          <span>{points.length ? jourCourt(points[0].jour) : ''}</span>
          <span>{points.length ? jourCourt(points[points.length - 1].jour) : ''}</span>
        </div>

        <p className="text-sm text-brunProfond mt-1 min-h-5">
          {actif && (
            <>
              {jourCourt(actif.jour)} — <span className="text-taupe">{format(actif.total)}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
