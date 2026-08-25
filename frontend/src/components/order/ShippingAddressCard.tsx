import type { AddressDto } from '@nissa/shared';
import { Card } from '@/components/ui';

/** Adresse figée au moment de la commande : c'est elle qui alimente le bordereau. */
export default function ShippingAddressCard({ address }: { address: AddressDto }) {
  return (
    <Card className="mb-6">
      <h2 className="text-xs uppercase tracking-wider text-taupe mb-3">Adresse de livraison</h2>
      <address className="text-sm text-brunProfond not-italic leading-relaxed">
        {address.recipientName}
        <br />
        {address.line1}
        <br />
        {address.line2 && (
          <>
            {address.line2}
            <br />
          </>
        )}
        {address.postalCode} {address.city}
        <br />
        {address.country}
        {address.phone && (
          <>
            <br />
            Tél. {address.phone}
          </>
        )}
      </address>
    </Card>
  );
}
