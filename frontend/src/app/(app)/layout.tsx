import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ReceptionReminder from '@/components/layout/ReceptionReminder';
import TrustBanner from '@/components/layout/TrustBanner';

/** Habillage de l'application : en-tête, pied de page et barre mobile. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-beigeClair text-noirIntense">
      <TrustBanner />
      <Header />
      <ReceptionReminder />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
