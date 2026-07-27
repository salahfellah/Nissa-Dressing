import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { COLORS } from '../../theme/colors';

type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'recorded';

export type VoiceMemoRecorderProps = {
  /** Called with an object URL to the recorded audio blob, or null if the memo is cleared. */
  onChange: (audioUrl: string | null) => void;
  /** Currently stored audio URL (lets the parent control/reset the recorder). */
  value: string | null;
  /** Max recording length in seconds before auto-stop. Defaults to 30s. */
  maxDurationSeconds?: number;
};

/**
 * Records a short "mémo vocal" using the browser's microphone (MediaRecorder API).
 * If mic access is denied or unavailable (e.g. no HTTPS/localhost, or blocked permissions),
 * it gracefully falls back to a simulated recording so the demo flow still works.
 */
export default function VoiceMemoRecorder({ onChange, value, maxDurationSeconds = 30 }: VoiceMemoRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>(value ? 'recorded' : 'idle');
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
    };
  }, []);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= maxDurationSeconds) {
          stopRecording();
          return maxDurationSeconds;
        }
        return s + 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    setStatus('requesting');

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      // Environment doesn't support recording (e.g. no HTTPS) — use fallback simulation.
      simulateRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        onChange(url);
        setStatus('recorded');
        stopStream();
        clearTimer();
      };

      recorder.start();
      setUsingFallback(false);
      setStatus('recording');
      startTimer();
    } catch (err) {
      // Permission denied or no microphone available — fall back to a simulated recording.
      simulateRecording();
    }
  };

  const simulateRecording = () => {
    setUsingFallback(true);
    setStatus('recording');
    startTimer();
    window.setTimeout(() => {
      clearTimer();
      onChange('mock-memo-vocal.webm');
      setStatus('recorded');
    }, 2200);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (usingFallback) {
      clearTimer();
      onChange('mock-memo-vocal.webm');
      setStatus('recorded');
    }
  };

  const reRecord = () => {
    if (value && value.startsWith('blob:')) URL.revokeObjectURL(value);
    onChange(null);
    setStatus('idle');
    setSeconds(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!value || usingFallback || value === 'mock-memo-vocal.webm') {
      // Nothing real to play in fallback/mock mode — just toggle a fake "playing" state briefly.
      setIsPlaying(true);
      window.setTimeout(() => setIsPlaying(false), 1500);
      return;
    }
    const audioEl = audioElRef.current;
    if (!audioEl) return;
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
  };

  const formatTime = (s: number) => `0:${s.toString().padStart(2, '0')}`;

  return (
    <div className="p-6 rounded-sm text-center" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.orDore}` }}>
      <p className="text-sm font-semibold mb-2" style={{ color: COLORS.orDore }}>
        Mémo vocal — Confirmation du port du voile
      </p>
      <p className="text-xs mb-6 leading-relaxed" style={{ color: COLORS.brunProfond }}>
        Enregistre un court message audio dans lequel tu confirmes porter le voile islamique et t'engages sincèrement
        envers la communauté. Cet audio reste confidentiel et n'est écouté que par l'administratrice.
      </p>

      {status === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105"
          style={{ backgroundColor: COLORS.sable, color: '#fff' }}
        >
          <Mic size={26} />
        </button>
      )}

      {status === 'requesting' && (
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: COLORS.sable }}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: COLORS.orDore, borderTopColor: 'transparent' }} />
        </div>
      )}

      {status === 'recording' && (
        <button
          type="button"
          onClick={stopRecording}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto recording-pulse"
          style={{ backgroundColor: COLORS.orDore, color: '#fff' }}
        >
          <Square size={22} fill="#fff" />
        </button>
      )}

      {status === 'recorded' && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ backgroundColor: COLORS.orDore, color: '#fff' }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS.brunProfond }}>
            <CheckCircle2 size={16} style={{ color: COLORS.orDore }} />
            Mémo enregistré
          </div>
          <button
            type="button"
            onClick={reRecord}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{ backgroundColor: COLORS.sable, color: COLORS.brunProfond }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}

      {status === 'recording' && (
        <p className="text-xs mt-3 font-medium" style={{ color: COLORS.orDore }}>
          Enregistrement... {formatTime(seconds)} / {formatTime(maxDurationSeconds)}
        </p>
      )}
      {status === 'idle' && (
        <p className="text-xs mt-3" style={{ color: COLORS.taupe }}>
          Appuyez pour enregistrer
        </p>
      )}
      {status === 'recorded' && !usingFallback && value && value.startsWith('blob:') && (
        <audio
          ref={audioElRef}
          src={value}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
