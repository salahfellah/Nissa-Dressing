'use client';

import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui';

/** Galerie de l'annonce : visuel principal et vignettes. */
export default function PhotoGallery({
  photos,
  title,
  isBoosted,
  soldLabel,
}: {
  photos: string[];
  title: string;
  isBoosted: boolean;
  /** Renseigné lorsque l'article n'est plus disponible. */
  soldLabel?: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative bg-white border border-sable rounded-sm overflow-hidden aspect-3/4 mb-3">
        {photos[active] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[active]}
            alt={`${title} — photo ${active + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-sable text-taupe">
            <ImageOff size={36} />
            <p className="text-xs uppercase tracking-wider">Photo à venir</p>
          </div>
        )}

        {isBoosted && (
          <span className="absolute top-3 left-3">
            <Badge>Mise en avant</Badge>
          </span>
        )}

        {soldLabel && (
          <div className="absolute inset-0 bg-noirIntense/60 flex items-center justify-center">
            <Badge variant="neutral">{soldLabel}</Badge>
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo}
              onClick={() => setActive(index)}
              aria-label={`Voir la photo ${index + 1}`}
              className={`aspect-square rounded-sm overflow-hidden border-2 transition-colors ${
                index === active ? 'border-orDore' : 'border-sable hover:border-taupe'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
