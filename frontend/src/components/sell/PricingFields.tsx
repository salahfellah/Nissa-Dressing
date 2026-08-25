'use client';

import { PACKAGE_FORMATS, formatPrice, toCents, type ListingInput } from '@nissa/shared';
import { Package } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Alert, Card, Input } from '@/components/ui';
import { usePlatformSettings } from '@/lib/providers';

/**
 * Prix et expédition — CDC §3.3.
 *
 * Le format de colis détermine les frais de port, à la charge de l'acheteuse.
 * Le récapitulatif affiche ce que la vendeuse touchera réellement : le montant
 * doit être connu avant la mise en ligne, pas découvert à la vente.
 */
export default function PricingFields({ form }: { form: UseFormReturn<ListingInput> }) {
  const settings = usePlatformSettings();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const packageFormat = watch('packageFormat');
  const priceCents = watch('priceCents');

  const shippingCents = settings.shippingFeesCents[packageFormat] ?? 0;
  const commissionCents = Math.round(
    (priceCents * settings.commissionPercent) / 100 + settings.commissionFixedCents,
  );
  const sellerGets =
    settings.commissionPayer === 'SELLER' ? priceCents - commissionCents : priceCents;

  return (
    <Card className="mb-6">
      <h2 className="font-playfair text-lg text-brunProfond mb-5">Prix et expédition</h2>

      <Controller
        name="priceCents"
        control={control}
        render={({ field }) => (
          <Input
            label="Prix de vente (€)"
            type="number"
            min={1}
            step="0.01"
            inputMode="decimal"
            placeholder="45"
            required
            error={errors.priceCents?.message}
            value={field.value ? String(field.value / 100) : ''}
            onChange={(event) =>
              field.onChange(event.target.value ? toCents(Number(event.target.value)) : 0)
            }
          />
        )}
      />

      <fieldset className="mb-4">
        <legend className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
          Format du colis <span className="text-orDore">*</span>
        </legend>

        <div className="grid sm:grid-cols-3 gap-3">
          {PACKAGE_FORMATS.map((format) => (
            <label
              key={format.id}
              className={`cursor-pointer border rounded-sm p-4 text-center transition-colors ${
                packageFormat === format.id
                  ? 'border-orDore bg-orDore/5'
                  : 'border-sable bg-white hover:border-taupe'
              }`}
            >
              <input type="radio" value={format.id} className="sr-only" {...register('packageFormat')} />
              <Package
                size={22}
                className={`mx-auto mb-2 ${packageFormat === format.id ? 'text-orDore' : 'text-taupe'}`}
              />
              <span className="block text-sm font-medium text-brunProfond">{format.label}</span>
              <span className="block text-xs text-taupe mt-1 leading-snug">{format.help}</span>
            </label>
          ))}
        </div>
        {errors.packageFormat && (
          <p className="mt-1.5 text-xs text-red-600">{errors.packageFormat.message}</p>
        )}
      </fieldset>

      {/* Mention imposée par le CDC §3.3. */}
      <Alert variant="info" title="Les frais de port sont à la charge de l’acheteuse">
        Pour ce format, elle réglera <strong>{formatPrice(shippingCents)}</strong> en plus du prix de
        ton article.
      </Alert>

      {priceCents > 0 && (
        <div className="bg-white border border-sable rounded-sm p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-taupe mb-3">Ce que tu recevras</p>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-brunProfond">Prix de ton article</dt>
              <dd className="text-brunProfond">{formatPrice(priceCents)}</dd>
            </div>
            {settings.commissionPayer === 'SELLER' && (
              <div className="flex justify-between">
                <dt className="text-brunProfond">
                  Participation plateforme ({settings.commissionPercent} %)
                </dt>
                <dd className="text-brunProfond">− {formatPrice(commissionCents)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-sable font-semibold">
              <dt className="text-brunProfond">Versé dès la réception du colis</dt>
              <dd className="text-brunProfond">{formatPrice(sellerGets)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  );
}
