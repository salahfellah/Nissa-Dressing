import type { PublicSellerDto } from '@nissa/shared';
import { Store } from 'lucide-react';
import Link from 'next/link';

/** Profil public de la vendeuse, affiché sur la page article. */
export default function SellerCard({ seller }: { seller: PublicSellerDto }) {
  return (
    <Link
      // Filtre par identifiant : la recherche plein texte porte sur le titre et
      // la description, jamais sur le pseudo — le lien n'aurait rien renvoyé.
      href={`/recherche?sellerId=${encodeURIComponent(seller.id)}`}
      className="flex items-center gap-3 p-4 bg-white border border-sable rounded-sm mb-6 hover:border-orDore transition-colors"
    >
      <span className="w-10 h-10 rounded-full bg-sable flex items-center justify-center text-brunProfond shrink-0">
        <Store size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-brunProfond">{seller.pseudo}</span>
        {seller.listingCount !== undefined && seller.salesCount !== undefined && (
          <span className="block text-xs text-taupe">
            {seller.listingCount} annonce{seller.listingCount > 1 ? 's' : ''} en ligne ·{' '}
            {seller.salesCount} vente{seller.salesCount > 1 ? 's' : ''}
          </span>
        )}
      </span>
    </Link>
  );
}
