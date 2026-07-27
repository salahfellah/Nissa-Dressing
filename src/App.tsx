import { useState } from 'react';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Categories from './pages/Categories';
import type { AppView } from './types';

export default function App() {
  const [view, setView] = useState<AppView>('splash');

  const handleAuthComplete = () => setView('home');
  const handleLogout = () => setView('splash');

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden selection:bg-[#C8A96A] selection:text-white font-montserrat">
      {view === 'splash' && <SplashScreen onNavigate={setView} />}
      {view === 'login' && <Login onNavigate={setView} onAuthComplete={handleAuthComplete} />}
      {view === 'signup' && <Signup onNavigate={setView} onAuthComplete={handleAuthComplete} />}
      {view === 'home' && <Home onLogout={handleLogout} onNavigate={setView} />}
      {view === 'categories' && <Categories onNavigate={setView} />}
    </div>
  );
}
