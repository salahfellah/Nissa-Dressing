/** Écrans du parcours d'inscription : volontairement sans en-tête ni pied de page. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-beigeClair">{children}</div>;
}
