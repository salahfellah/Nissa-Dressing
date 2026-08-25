import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-beigeClair font-montserrat text-noirIntense selection:bg-orDore selection:text-white">
      <div className="bg-brunProfond text-beigeClair text-xs py-2 px-4 text-center font-light tracking-wide">
        Marketplace sécurisée 100% entre sœurs • Modération stricte de chaque annonce
      </div>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
