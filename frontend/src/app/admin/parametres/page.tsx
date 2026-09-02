'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  formatPrice,
  settingsSchema,
  toCents,
  type PlatformSettings,
  type SettingsInput,
} from '@nissa/shared';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { Alert, Button, Card, Input, SectionTitle, Select, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

/**
 * Paramètres de plateforme — CDC §3.9.
 *
 * C'est ici que se règlent les quatre points laissés « à définir » par le CDC §6 :
 * taux et assiette de la commission, prix du boost mensuel, frais de port, frais
 * d'accès. Aucune modification de code n'est nécessaire.
 */
export default function AdminSettingsPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    api
      .get<PlatformSettings>('/admin/settings')
      .then((settings) => {
        reset(settings);
        setIsReady(true);
      })
      .catch(() => setError('Les paramètres n’ont pas pu être chargés.'));
  }, [reset]);

  const onSubmit = async (data: SettingsInput) => {
    setError(null);
    try {
      await api.put('/admin/settings', data);
      setNotice('Paramètres enregistrés. Ils s’appliquent immédiatement aux nouvelles commandes.');
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Enregistrement impossible.');
    }
  };

  if (!isReady && !error) return <Spinner />;

  const commissionPercent = watch('commissionPercent') ?? 0;
  const commissionFixed = watch('commissionFixedCents') ?? 0;
  const payer = watch('commissionPayer');

  /** Exemple chiffré sur un article à 40 € — rend le réglage concret. */
  const exampleItem = 4000;
  const exampleCommission = Math.round((exampleItem * commissionPercent) / 100 + commissionFixed);

  /** Champ monétaire : saisie en euros par l'administratrice, stockage en centimes. */
  const moneyField = (name: FieldPath<SettingsInput>, label: string, hint?: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input
          label={label}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          hint={hint}
          error={fieldState.error?.message}
          value={typeof field.value === 'number' ? String(field.value / 100) : ''}
          onChange={(event) =>
            field.onChange(event.target.value ? toCents(Number(event.target.value)) : 0)
          }
        />
      )}
    />
  );

  return (
    <>
      <SectionTitle subtitle="Commission, mise en avant et frais de port — modifiables sans redéploiement.">
        Paramètres de la plateforme
      </SectionTitle>

      {notice && (
        <Alert variant="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl" noValidate>
        <Card className="mb-6">
          <h2 className="font-playfair text-lg text-brunProfond mb-4">Commission sur les ventes</h2>

          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="flex-1">
              <Input
                label="Taux (%)"
                type="number"
                min={0}
                max={50}
                step="0.1"
                required
                error={errors.commissionPercent?.message}
                {...register('commissionPercent', { valueAsNumber: true })}
              />
            </div>
            <div className="flex-1">
              {moneyField('commissionFixedCents', 'Part fixe (€)', 'Laisse 0 pour un pourcentage seul.')}
            </div>
          </div>

          <Select
            label="À la charge de"
            required
            error={errors.commissionPayer?.message}
            {...register('commissionPayer')}
          >
            <option value="BUYER">L’acheteuse (s’ajoute à son total)</option>
            <option value="SELLER">La vendeuse (déduite de son versement)</option>
          </Select>

          <Alert variant="info" title="Exemple sur un article à 40 €">
            Commission prélevée : <strong>{formatPrice(exampleCommission)}</strong>.{' '}
            {payer === 'BUYER'
              ? `L’acheteuse paie ${formatPrice(exampleItem + exampleCommission)} hors port ; la vendeuse reçoit ${formatPrice(exampleItem)}.`
              : `L’acheteuse paie ${formatPrice(exampleItem)} hors port ; la vendeuse reçoit ${formatPrice(exampleItem - exampleCommission)}.`}
          </Alert>
        </Card>

        <Card className="mb-6">
          <h2 className="font-playfair text-lg text-brunProfond mb-4">Accès et mise en avant</h2>

          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="flex-1">
              {moneyField('accessFeeCents', 'Frais d’accès à vie (€)', 'Participation unique à l’inscription.')}
            </div>
            <div className="flex-1">
              {moneyField('boostPriceCents', 'Boost mensuel (€)', 'Abonnement de mise en avant.')}
            </div>
          </div>

          <Input
            label="Boost offert à l’inscription (jours)"
            type="number"
            min={0}
            max={365}
            required
            error={errors.freeBoostDays?.message}
            {...register('freeBoostDays', { valueAsNumber: true })}
          />
        </Card>

        <Card className="mb-6">
          <h2 className="font-playfair text-lg text-brunProfond mb-1">Frais de port</h2>
          <p className="text-xs text-taupe mb-4">
            À la charge de l’acheteuse, selon le format de colis choisi par la vendeuse.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {moneyField('shippingFeesCents.PETIT', 'Petit (€)')}
            {moneyField('shippingFeesCents.MOYEN', 'Moyen (€)')}
            {moneyField('shippingFeesCents.GRAND', 'Grand (€)')}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="font-playfair text-lg text-brunProfond mb-1">Réception des colis</h2>
          <p className="text-xs text-taupe mb-4">
            Passé ce délai à compter de l’expédition, une commande sans réponse de l’acheteuse est
            considérée comme bien reçue : le reversement devient possible et la fenêtre de
            réclamation se ferme. Les commandes déjà en litige ne sont jamais concernées.
          </p>

          <Input
            label="Délai de confirmation (jours)"
            type="number"
            min={1}
            max={90}
            required
            error={errors.autoConfirmDays?.message}
            {...register('autoConfirmDays', { valueAsNumber: true })}
          />
        </Card>

        <Card className="mb-6">
          <h2 className="font-playfair text-lg text-brunProfond mb-4">Support</h2>
          <Input
            label="E-mail recevant les demandes de contact"
            type="email"
            required
            error={errors.supportEmail?.message}
            {...register('supportEmail')}
          />
        </Card>

        <Button type="submit" isLoading={isSubmitting}>
          <Save size={16} />
          Enregistrer les paramètres
        </Button>
      </form>
    </>
  );
}
