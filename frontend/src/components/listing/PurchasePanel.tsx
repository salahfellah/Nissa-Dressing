'use client';

import { computePrice, formatPrice, type ListingDto } from '@nissa/shared';
import { Info, ShieldCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, ButtonLink, Card } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usePlatformSettings } from '@/lib/providers';

/**
 * Récapitulatif et bouton d'achat — entrée du tunnel CDC §3.6.
 *
 * Le détail des montants est affiché avant tout engagement : l'acheteuse voit
 * le port et les frais de protection avant de cliquer, jamais après.
 */
export default function PurchasePanel({ listing }: { listing: ListingDto }) {
  const router = useRouter();
  const { user, isMember } = useAuth();
  const settings = usePlatformSettings();

  const [error, setError] = useState<string | null>(null);
  const [addressIssue, setAddressIssue] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const isOwner = user?.id === listing.sellerId;
  const isAvailable = listing.status === 'PUBLISHED';
  const price = computePrice(listing.priceCents, listing.packageFormat, settings);

  const startPurchase = async () => {
    if (!user) {
      router.push('/connexion');
      return;
    }
    // L'adresse de livraison alimente le bordereau : elle doit exister avant la commande.
    if (!user.address) {
      router.push(`/compte?retour=${encodeURIComponent(`/article/${listing.id}`)}`);
      return;
    }

    setError(null);
    setIsBuying(true);
    try {
      const { paymentUrl } = await api.post<{ paymentUrl: string }>('/orders', {
        listingId: listing.id,
        shippingAddress: user.address,
      });
      window.location.href = paymentUrl;
    } catch (exception) {
      if (exception instanceof ApiError) {
        // Le seul formulaire en jeu ici est l'adresse, et il n'est pas sur cette
        // page : un message « certains champs sont invalides » laisserait
        // l'acheteuse sans rien à corriger. On la renvoie là où elle peut agir.
        const adresseInvalide = Object.keys(exception.fieldErrors).some((champ) =>
          champ.startsWith('shippingAddress'),
        );
        setError(
          adresseInvalide
            ? 'Ton adresse de livraison est incomplète. Corrige-la depuis ton compte et reviens : ton article t’attend.'
            : exception.message,
        );
        setAddressIssue(adresseInvalide);
      } else {
        setError('Ta commande n’a pas pu être créée. Réessaie dans un instant.');
      }
      setIsBuying(false);
    }
  };

  if (isOwner) {
    return (
      <Alert variant="info" title="C’est ton annonce">
        Retrouve-la dans « Mes annonces » pour la modifier ou la mettre en avant.
      </Alert>
    );
  }

  if (!isAvailable) {
    return (
      <Alert variant="warning" title="Cet article n’est plus disponible">
        Il a trouvé preneuse ou a été retiré du catalogue. Il y en a d’autres, in cha Allah.
      </Alert>
    );
  }

  if (!user) {
    return (
      <>
        <ButtonLink href="/inscription">Rejoindre pour acheter</ButtonLink>
        <p className="text-xs text-taupe mt-3 text-center">
          Les achats sont réservés aux sœurs de la communauté.
        </p>
      </>
    );
  }

  if (!isMember) {
    return (
      <Alert variant="info" title="Encore une étape">
        Ton inscription n’est pas tout à fait terminée. Finalise-la et cet article sera à toi en
        deux clics.
      </Alert>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="error">
          {error}
          {addressIssue && (
            <>
              {' '}
              <Link href="/compte" className="underline font-semibold">
                Corriger mon adresse
              </Link>
            </>
          )}
        </Alert>
      )}

      <Card className="mb-4">
        <h2 className="text-xs text-taupe mb-3">Récapitulatif</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-brunProfond">Article</dt>
            <dd className="text-brunProfond">{formatPrice(price.itemPriceCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brunProfond">Frais de port</dt>
            <dd className="text-brunProfond">{formatPrice(price.shippingCents)}</dd>
          </div>
          {price.commissionPayer === 'BUYER' && price.commissionCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-brunProfond">Frais de protection acheteuse</dt>
              <dd className="text-brunProfond">{formatPrice(price.commissionCents)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-sable font-semibold">
            <dt className="text-brunProfond">Total</dt>
            <dd className="text-brunProfond">{formatPrice(price.totalCents)}</dd>
          </div>
        </dl>
      </Card>

      <Button onClick={startPurchase} isLoading={isBuying}>
        <ShoppingBag size={16} />
        Acheter — {formatPrice(price.totalCents)}
      </Button>

      <p className="flex items-start gap-2 text-xs text-taupe mt-4 leading-relaxed">
        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-orDore" />
        Ton paiement est gardé en sécurité et n’est versé à la vendeuse qu’une fois que tu as
        confirmé avoir bien reçu ton colis.
      </p>

      {!user.address && (
        <p className="flex items-start gap-2 text-xs text-taupe mt-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          Nous te demanderons ton adresse de livraison avant le paiement.
        </p>
      )}
    </>
  );
}
