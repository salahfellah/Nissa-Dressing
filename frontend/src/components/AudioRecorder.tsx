'use client';

import { CheckCircle2, Mic, RotateCcw, Square, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert } from './ui';

interface AudioRecorderProps {
  onChange: (file: File | Blob | null) => void;
  /** Durée maximale d'enregistrement, en secondes. */
  maxSeconds?: number;
}

const formatDuration = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Dépôt de serment — CDC §3.1.
 *
 * Le cahier des charges prévoit « enregistrement **ou** dépôt » : les deux voies
 * sont proposées, l'upload servant aussi de repli quand le micro est refusé ou
 * indisponible (navigateur non compatible, contexte non sécurisé).
 */
export default function AudioRecorder({ onChange, maxSeconds = 120 }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Libère micro, minuteur et URL d'aperçu si le composant disparaît en cours
  // d'enregistrement — sinon le voyant du micro resterait allumé.
  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Votre navigateur ne permet pas l’enregistrement. Déposez un fichier audio ci-dessous.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
        setHasAudio(true);
        onChange(blob);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((value) => {
          if (value + 1 >= maxSeconds) {
            recorder.state === 'recording' && recorder.stop();
            setIsRecording(false);
            stopTimer();
          }
          return value + 1;
        });
      }, 1000);
    } catch {
      setError(
        'Micro indisponible ou refusé. Autorise l’accès au micro, ou dépose un fichier audio ci-dessous.',
      );
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setIsRecording(false);
  };

  const reset = () => {
    setHasAudio(false);
    setSeconds(0);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    onChange(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setHasAudio(true);
    onChange(file);
  };

  return (
    <div className="p-6 rounded-sm mb-6 bg-white border border-orDore text-center">
      <p className="text-sm font-semibold mb-3 text-orDore uppercase tracking-wider">
        Dépôt de serment
      </p>
      <p className="text-xs mb-6 text-brunProfond leading-relaxed">
        Enregistrez un court message audio dans lequel vous prêtez serment d’être véritablement une
        sœur. Cet enregistrement reste confidentiel : il n’est écouté que par l’administratrice, et
        il est supprimé si votre candidature n’est pas retenue.
      </p>

      <button
        type="button"
        onClick={isRecording ? stopRecording : hasAudio ? reset : startRecording}
        aria-label={
          isRecording ? 'Arrêter l’enregistrement' : hasAudio ? 'Recommencer' : 'Démarrer l’enregistrement'
        }
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105 text-white ${
          hasAudio ? 'bg-orDore' : isRecording ? 'bg-red-700 animate-pulse' : 'bg-taupe'
        }`}
      >
        {hasAudio ? <CheckCircle2 size={30} /> : isRecording ? <Square size={26} /> : <Mic size={28} />}
      </button>

      <p className="text-xs mt-3 text-taupe">
        {hasAudio
          ? 'Enregistrement prêt'
          : isRecording
            ? `Enregistrement en cours — ${formatDuration(seconds)} (touche pour arrêter)`
            : 'Touche pour enregistrer'}
      </p>

      {previewUrl && (
        <div className="mt-4">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={previewUrl} controls className="w-full" />
          {hasAudio && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 text-xs underline text-taupe hover:text-brunProfond inline-flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Recommencer
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 text-left">
          <Alert variant="warning">{error}</Alert>
        </div>
      )}

      {!hasAudio && (
        <label className="flex items-center justify-center gap-2 mt-5 text-xs text-brunProfond underline cursor-pointer hover:text-orDore">
          <Upload size={14} />
          ou dépose un fichier audio
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        </label>
      )}
    </div>
  );
}
