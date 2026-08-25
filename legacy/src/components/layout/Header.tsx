import { Heart, MessageCircle, Plus, Search, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-beigeClair/95 backdrop-blur-sm border-b border-sable">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          <Link to="/catalogue" className="flex-shrink-0 flex items-center">
            <Logo size="small" />
          </Link>

          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
            <input
              type="text"
              placeholder="Rechercher une abaya, un khimar, une taille..."
              className="w-full bg-white border border-sable rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-orDore focus:border-orDore transition-colors"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-orDore transition-colors">
              <Search size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="hidden md:flex items-center space-x-6 text-brunProfond">
              <Link to="/favoris" className="hover:text-orDore transition-colors flex flex-col items-center gap-1">
                <Heart size={20} />
                <span className="text-[0.65rem] tracking-wider uppercase">Favoris</span>
              </Link>
              <Link to="/messages" className="hover:text-orDore transition-colors flex flex-col items-center gap-1">
                <MessageCircle size={20} />
                <span className="text-[0.65rem] tracking-wider uppercase">Messages</span>
              </Link>
              <Link to="/compte" className="hover:text-orDore transition-colors flex flex-col items-center gap-1">
                <User size={20} />
                <span className="text-[0.65rem] tracking-wider uppercase">Compte</span>
              </Link>
              <button
                onClick={logout}
                className="hover:text-orDore transition-colors flex flex-col items-center gap-1"
              >
                <LogOut size={20} />
                <span className="text-[0.65rem] tracking-wider uppercase">Quitter</span>
              </button>
            </div>

            <Link
              to="/vendre"
              className="bg-orDore hover:bg-[#b09355] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-sm flex items-center gap-2 text-xs md:text-sm font-medium tracking-wide transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Vendre un article</span>
              <span className="sm:hidden">Vendre</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
