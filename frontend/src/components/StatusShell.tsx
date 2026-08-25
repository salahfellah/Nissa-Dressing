import { Logo } from './ui';

/** Gabarit commun aux écrans de statut du parcours d'inscription (CDC §3.1). */
export default function StatusShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-md mx-auto fade-in">
      <Logo size="small" />
      <h1 className="text-2xl font-playfair mt-10 mb-4 text-brunProfond">{title}</h1>
      <div className="w-full">{children}</div>
    </main>
  );
}
