'use client';

import {
  CONDITION_LABELS,
  PACKAGE_FORMAT_LABELS,
  findSubcategory,
  formatPrice,
  type ListingDto,
} from '@nissa/shared';
import { Check, ImageOff, X } from 'lucide-react';
import { Alert, Button, Card, Textarea } from '@/components/ui';

/**
 * Une annonce en file de modération — CDC §3.9.
 *
 * Les mentions conditionnelles de la sous-catégorie et le rappel des règles
 * photos sont affichés à côté de l'annonce : l'administratrice n'a pas à
 * retenir la charte par cœur pour trancher.
 */
export default function ModerationCard({
  listing,
  reason,
  isBusy,
  onReasonChange,
  onApprove,
  onReject,
}: {
  listing: ListingDto;
  reason: string;
  isBusy: boolean;
  onReasonChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const subcategory = findSubcategory(listing.subcategoryId)?.subcategory;

  const attributes: [string, string][] = [
    ['Taille', listing.size],
    ['État', CONDITION_LABELS[listing.condition]],
    ['Matière', listing.material],
    ['Couleur', listing.color],
    ['Marque', listing.brand ?? 'Sans marque'],
    ['Colis', PACKAGE_FORMAT_LABELS[listing.packageFormat]],
  ];

  return (
    <Card>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-72 shrink-0">
          {listing.photos.length ? (
            <div className="grid grid-cols-2 gap-2">
              {listing.photos.map((photo, index) => (
                <a
                  key={photo}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-3/4 bg-sable rounded-sm overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <div className="aspect-3/4 bg-sable rounded-sm flex flex-col items-center justify-center gap-2 text-taupe">
              <ImageOff size={26} />
              <p className="text-xs">Aucune photo</p>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
            <h2 className="font-playfair text-lg text-brunProfond">{listing.title}</h2>
            <span className="font-semibold text-brunProfond">{formatPrice(listing.priceCents)}</span>
          </div>

          <p className="text-xs text-taupe mb-4">
            {listing.categoryLabel} · par {listing.seller?.pseudo ?? '—'} · déposée le{' '}
            {new Date(listing.createdAt).toLocaleDateString('fr-FR')}
          </p>

          {subcategory?.note && (
            <Alert variant="warning" title={`À vérifier — ${subcategory.label}`}>
              {subcategory.note}
            </Alert>
          )}

          <Alert variant="info" title="Rappel des règles photos">
            Pas de photo portée (sauf vêtements couvrants) · aucune représentation d’âme · l’article
            doit être le vrai, pas une image de site marchand.
          </Alert>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-4 text-sm">
            {attributes.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[0.7rem] uppercase tracking-wider text-taupe">{label}</dt>
                <dd className="text-brunProfond">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mb-4">
            <p className="text-[0.7rem] uppercase tracking-wider text-taupe mb-1">Description</p>
            <p className="text-sm text-brunProfond leading-relaxed whitespace-pre-wrap bg-beigeClair p-3 rounded-sm">
              {listing.description}
            </p>
          </div>

          <Textarea
            label="Motif (obligatoire pour refuser)"
            rows={2}
            placeholder="Ex. La photo est portée, ce qui n’est pas autorisé pour cette catégorie."
            hint="Ce motif est transmis à la vendeuse : formule-le avec douceur, elle pourra corriger."
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onApprove} isLoading={isBusy}>
              <Check size={16} />
              Publier l’annonce
            </Button>
            <Button variant="danger" onClick={onReject} isLoading={isBusy}>
              <X size={16} />
              Refuser
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
