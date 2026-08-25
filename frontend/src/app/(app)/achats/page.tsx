import { RequireMember } from '@/components/guards';
import OrderList from '@/components/OrderList';

export const metadata = { title: 'Mes achats' };

export default function PurchasesPage() {
  return (
    <RequireMember>
      <OrderList
        role="buyer"
        title="Mes achats"
        subtitle="Suis tes commandes, du paiement à la réception."
        emptyTitle="Aucun achat pour l’instant"
        emptyDescription="Tes commandes apparaîtront ici, avec leur suivi et la messagerie associée."
      />
    </RequireMember>
  );
}
