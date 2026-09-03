'use client';

import { PHOTO_WARNING, allowsWornPhotos } from '@nissa/shared';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Alert } from './ui';

export interface UploadedPhoto {
  path: string;
  url: string;
}

interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  /** Sous-catégorie choisie : détermine si la photo portée est tolérée (CDC §3.3). */
  subcategoryId?: string;
  max?: number;
  error?: string;
}

/**
 * Dépôt des photos d'annonce — CDC §3.3.
 *
 * L'avertissement sur les photos portées et les représentations d'âme est affiché
 * systématiquement, avant tout ajout, conformément au cahier des charges.
 */
export default function PhotoUploader({
  photos,
  onChange,
  subcategoryId,
  max = 8,
  error,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const wornAllowed = subcategoryId ? allowsWornPhotos(subcategoryId) : false;

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const remaining = max - photos.length;
    if (remaining <= 0) {
      setUploadError(`Vous avez atteint la limite de ${max} photos.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      files.slice(0, remaining).forEach((file) => formData.append('files', file));

      const uploaded = await api.upload<UploadedPhoto[]>('/uploads/photos', formData);
      onChange([...photos, ...uploaded]);
    } catch (uploadException) {
      setUploadError(
        uploadException instanceof ApiError
          ? uploadException.message
          : 'Le téléversement a échoué. Réessayez.',
      );
    } finally {
      setIsUploading(false);
      // Permet de resélectionner le même fichier après une erreur.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = (path: string) => {
    onChange(photos.filter((photo) => photo.path !== path));
  };

  /** La première photo sert de vignette au catalogue. */
  const makeCover = (path: string) => {
    const photo = photos.find((item) => item.path === path);
    if (!photo) return;
    onChange([photo, ...photos.filter((item) => item.path !== path)]);
  };

  return (
    <div className="mb-6">
      <p className="block text-xs font-semibold uppercase tracking-wider mb-2 text-brunProfond">
        Photos <span className="text-orDore">*</span>
      </p>

      <Alert variant="warning" title={`⚠️ ${PHOTO_WARNING.title}`}>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          {PHOTO_WARNING.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {subcategoryId && (
          <p className="mt-2 font-semibold">
            {wornAllowed
              ? 'Cette catégorie fait partie des vêtements couvrants : la photo portée est acceptée.'
              : 'Cette catégorie n’autorise pas les photos portées.'}
          </p>
        )}
      </Alert>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <div
            key={photo.path}
            className="relative aspect-3/4 bg-white border border-sable rounded-sm overflow-hidden group"
          >
            {/* Aperçu local : next/image n'apporte rien sur une image déjà optimisée par l'API. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

            {index === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-orDore text-white text-[0.6rem] uppercase tracking-wider py-1 text-center">
                Photo principale
              </span>
            )}

            <button
              type="button"
              onClick={() => removePhoto(photo.path)}
              aria-label="Supprimer cette photo"
              className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-brunProfond hover:bg-red-600 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>

            {index !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(photo.path)}
                aria-label="Définir comme photo principale"
                title="Définir comme photo principale"
                className="absolute top-1 left-1 bg-white/90 rounded-full p-1 text-brunProfond hover:bg-orDore hover:text-white transition-colors"
              >
                <Star size={14} />
              </button>
            )}
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-3/4 border-2 border-dashed border-sable rounded-sm flex flex-col items-center justify-center gap-2 text-taupe hover:border-orDore hover:text-orDore transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            <span className="text-[0.65rem] uppercase tracking-wider">
              {isUploading ? 'Envoi…' : 'Ajouter'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      <p className="mt-2 text-xs text-taupe">
        {photos.length}/{max} photo{photos.length > 1 ? 's' : ''} — la première est la vignette du
        catalogue. JPEG, PNG, WebP ou HEIC.
      </p>

      {(uploadError || error) && (
        <p className="mt-1.5 text-xs text-red-600">{uploadError ?? error}</p>
      )}
    </div>
  );
}
