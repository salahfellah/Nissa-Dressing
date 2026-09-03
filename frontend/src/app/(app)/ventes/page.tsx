import { RequireMember } from '@/components/guards';
import OrderList from '@/components/OrderList';

export const metadata = { title: 'Mes ventes' };

export default function SalesPage() {
  return (
    <RequireMember>
      <OrderList
        role="seller"
        title="Mes ventes"
        subtitle="Téléchargez vos bordereaux et suivez le versement de vos paiements."
        emptyTitle="Aucune vente pour l’instant"
        emptyDescription="Dès qu’une sœur achètera l’une de vos pièces, la commande apparaîtra ici."
      />
    </RequireMember>
  );
}
