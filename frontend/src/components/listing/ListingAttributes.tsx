import { CONDITION_LABELS, PACKAGE_FORMATS, type ListingDto } from '@nissa/shared';
import { Package } from 'lucide-react';

/** Caractéristiques de l'article et aide sur le format de colis. */
export default function ListingAttributes({ listing }: { listing: ListingDto }) {
  const packageInfo = PACKAGE_FORMATS.find((format) => format.id === listing.packageFormat);

  const rows: [string, string][] = [
    ['Taille', listing.size],
    ['État', CONDITION_LABELS[listing.condition]],
    ['Matière', listing.material],
    ['Couleur', listing.color],
    ['Marque', listing.brand ?? 'Sans marque'],
  ];

  return (
    <>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 pb-6 border-b border-sable">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[0.7rem] uppercase tracking-wider text-taupe">{label}</dt>
            <dd className="text-sm text-brunProfond font-medium mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-wider text-taupe mb-2">Description</h2>
        <p className="text-sm text-brunProfond leading-relaxed whitespace-pre-wrap">
          {listing.description}
        </p>
      </div>

      {packageInfo && (
        <p className="flex items-start gap-2 text-xs text-taupe mb-6">
          <Package size={14} className="shrink-0 mt-0.5" />
          Colis {packageInfo.label.toLowerCase()} — {packageInfo.help.toLowerCase()}
        </p>
      )}
    </>
  );
}
