'use client';

import { computePrice, formatPrice, type AddressInput, type ListingDto } from '@nissa/shared';
import { Info, ShieldCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AddressForm from '@/components/account/AddressForm';
import { Alert, Button, ButtonLink, Card, Modal } from '@/components/ui';
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
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [destination, setDestination] = useState<'compte' | 'autre'>('compte');

  const isOwner = user?.id === listing.sellerId;
  const isAvailable = listing.status === 'PUBLISHED';
  const price = computePrice(listing.priceCents, listing.packageFormat, settings);

  /**
   * Le colis ne part pas toujours chez l'acheteuse : cadeau, livraison chez une
   * proche, absence pendant la semaine. On lui laisse donc le choix avant de
   * l'envoyer payer — après le paiement il serait trop tard, et une adresse
   * ponctuelle ne doit pas remplacer celle de son compte.
   */
  const ouvrirChoixLivraison = () => {
    if (!user) {
      router.push('/connexion');
      return;
    }
    setError(null);
    // Sans adresse enregistrée, la saisie ponctuelle est la seule option.
    setDestination(user.address ? 'compte' : 'autre');
    setChoixOuvert(true);
  };

  const lancerCommande = async (shippingAddress: AddressInput) => {
    setError(null);
    setIsBuying(true);
    try {
      const { paymentUrl } = await api.post<{ paymentUrl: string }>('/orders', {
        listingId: listing.id,
        shippingAddress,
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
            ? 'Votre adresse de livraison est incomplète. Corrigez-la depuis votre compte et revenez : votre article vous attend.'
            : exception.message,
        );
        setAddressIssue(adresseInvalide);
      } else {
        setError('Votre commande n’a pas pu être créée. Réessayez dans un instant.');
      }
      setChoixOuvert(false);
      setIsBuying(false);
    }
  };

  if (isOwner) {
    return (
      <Alert variant="info" title="C’est votre annonce">
        Retrouvez-la dans « Mes annonces » pour la modifier ou la mettre en avant.
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
        Votre inscription n’est pas tout à fait terminée. Finalisez-la et cet article sera à vous en
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

      <Button onClick={ouvrirChoixLivraison} isLoading={isBuying}>
        <ShoppingBag size={16} />
        Acheter — {formatPrice(price.totalCents)}
      </Button>

      <Modal
        open={choixOuvert}
        onClose={() => setChoixOuvert(false)}
        title="Où livrer votre colis ?"
      >
        {user.address && (
          <label
            className={`block border rounded-sm p-4 mb-3 cursor-pointer transition-colors ${
              destination === 'compte' ? 'border-orDore bg-orDore/5' : 'border-sable'
            }`}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="destination"
                className="mt-1 accent-orDore"
                checked={destination === 'compte'}
                onChange={() => setDestination('compte')}
              />
              <span className="text-sm">
                <span className="block font-medium text-brunProfond">Mon adresse</span>
                <span className="block text-taupe mt-1 leading-relaxed">
                  {user.address.recipientName}
                  <br />
                  {user.address.line1}
                  {user.address.line2 ? (
                    <>
                      <br />
                      {user.address.line2}
                    </>
                  ) : null}
                  <br />
                  {user.address.postalCode} {user.address.city}
                  <br />
                  {user.address.country}
                </span>
              </span>
            </span>
          </label>
        )}

        <label
          className={`block border rounded-sm p-4 mb-4 cursor-pointer transition-colors ${
            destination === 'autre' ? 'border-orDore bg-orDore/5' : 'border-sable'
          }`}
        >
          <span className="flex items-start gap-3">
            <input
              type="radio"
              name="destination"
              className="mt-1 accent-orDore"
              checked={destination === 'autre'}
              onChange={() => setDestination('autre')}
            />
            <span className="text-sm">
              <span className="block font-medium text-brunProfond">Une autre adresse</span>
              <span className="block text-taupe mt-1">
                Chez une proche, au travail… Votre adresse habituelle n’est pas modifiée.
              </span>
            </span>
          </span>
        </label>

        {destination === 'compte' && user.address ? (
          <Button onClick={() => lancerCommande(user.address as AddressInput)} isLoading={isBuying}>
            <ShoppingBag size={16} />
            Continuer vers le paiement
          </Button>
        ) : (
          <AddressForm
            startEmpty
            submitLabel="Continuer vers le paiement"
            onSubmitValues={lancerCommande}
          />
        )}
      </Modal>

      <p className="flex items-start gap-2 text-xs text-taupe mt-4 leading-relaxed">
        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-orDore" />
        Votre paiement est gardé en sécurité et n’est versé à la vendeuse qu’une fois que vous avez
        confirmé avoir bien reçu votre colis.
      </p>

      {!user.address && (
        <p className="flex items-start gap-2 text-xs text-taupe mt-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          Nous vous demanderons votre adresse de livraison avant le paiement.
        </p>
      )}
    </>
  );
}
