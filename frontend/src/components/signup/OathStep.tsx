'use client';

import AudioRecorder from '@/components/AudioRecorder';
import { Alert, Button } from '@/components/ui';

/** Dépôt de serment audio — CDC §3.1. */
export default function OathStep({
  audio,
  onAudioChange,
  formError,
  isSubmitting,
  onSubmit,
}: {
  audio: File | Blob | null;
  onAudioChange: (file: File | Blob | null) => void;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <section className="fade-in text-center mt-6">
      <h1 className="text-2xl font-playfair mb-4 text-brunProfond">Une dernière étape</h1>
      <p className="text-sm mb-8 leading-relaxed text-brunProfond">
        Pour préserver la confiance entre nous, chaque candidature est accompagnée d’un court
        message audio. Prenez le temps qu’il vous faut, personne d’autre que l’administratrice ne
        l’écoutera.
      </p>

      {formError && (
        <div className="text-left">
          <Alert variant="error">{formError}</Alert>
        </div>
      )}

      <AudioRecorder onChange={onAudioChange} />

      <Button onClick={onSubmit} disabled={!audio} isLoading={isSubmitting}>
        Envoyer ma candidature
      </Button>
    </section>
  );
}
