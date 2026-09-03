'use client';

import type { ReturnRequestDto } from '@nissa/shared';
import { CreditCard, KeyRound, LogOut, MapPin, Undo2, User as UserIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AccountDashboard from '@/components/account/AccountDashboard';
import AccountShortcuts from '@/components/account/AccountShortcuts';
import AddressForm from '@/components/account/AddressForm';
import PasswordForm from '@/components/account/PasswordForm';
import ProfileForm from '@/components/account/ProfileForm';
import ReturnsList from '@/components/account/ReturnsList';
import StripeCard from '@/components/account/StripeCard';
import { RequireMember } from '@/components/guards';
import { Alert, Button, Card, SectionTitle, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/** Titre de section, avec son icône. */
function Block({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof UserIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-6">
      <h2 className="font-playfair text-lg text-brunProfond mb-1 flex items-center gap-2">
        <Icon size={18} className="text-orDore" />
        {title}
      </h2>
      {subtitle && <p className="text-xs text-taupe mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </Card>
  );
}

/** Espace personnel — CDC §3.2. */
function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const [returns, setReturns] = useState<ReturnRequestDto[]>([]);
  const returnTo = searchParams.get('retour');

  useEffect(() => {
    api
      .get<ReturnRequestDto[]>('/returns')
      .then(setReturns)
      .catch(() => undefined);
  }, []);

  if (!user) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SectionTitle subtitle={`Bienvenue ${user.prenom}, contente de vous revoir.`}>
        Mon compte
      </SectionTitle>

      {returnTo && (
        <Alert variant="info" title="Il nous manque votre adresse de livraison">
          Renseignez-la ci-dessous et nous vous ramenons aussitôt à votre achat.
        </Alert>
      )}

      <AccountDashboard />

      <AccountShortcuts />

      <Block
        icon={CreditCard}
        title="Compte de paiement"
        subtitle="Nécessaire pour recevoir le paiement de vos ventes."
      >
        <StripeCard />
      </Block>

      <Block icon={UserIcon} title="Informations personnelles">
        <ProfileForm />
      </Block>

      <Block
        icon={MapPin}
        title="Adresse postale"
        subtitle="Adresse de livraison pour vos achats, et d'expédition sur vos bordereaux de vente."
      >
        <AddressForm onSaved={() => returnTo && router.push(returnTo)} />
      </Block>

      {returns.length > 0 && (
        <Block icon={Undo2} title="Mes demandes de retour">
          <ReturnsList requests={returns} />
        </Block>
      )}

      <Block icon={KeyRound} title="Mot de passe">
        <PasswordForm />
      </Block>

      <Button variant="ghost" onClick={() => void logout()}>
        <LogOut size={16} />
        Se déconnecter
      </Button>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireMember>
      <Suspense fallback={<Spinner />}>
        <AccountContent />
      </Suspense>
    </RequireMember>
  );
}
