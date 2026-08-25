import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import AppRouter from './router';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <AppRouter />
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
