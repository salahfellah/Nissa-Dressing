import { useRef, useState } from 'react';
import { Mic, Square, Upload, CheckCircle2 } from 'lucide-react';

interface AudioRecorderProps {
  onChange: (file: File | Blob | null) => void;
}

// Enregistrement via MediaRecorder, avec repli sur le dépôt de fichier (le CDC autorise "enregistrement OU dépôt").
export default function AudioRecorder({ onChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setPreviewUrl(URL.createObjectURL(blob));
        setHasAudio(true);
        onChange(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Micro indisponible. Vous pouvez déposer un fichier audio ci-dessous.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setHasAudio(true);
    onChange(file);
  };

  return (
    <div className="p-6 rounded-sm mb-8 bg-white border border-orDore">
      <p className="text-sm font-semibold mb-4 text-orDore">Dépôt de serment</p>
      <p className="text-xs mb-6 text-brunProfond">
        Enregistre un court message audio dans lequel tu prêtes serment d'être véritablement une sœur. Cet audio
        restera confidentiel et sera écouté uniquement par l'administratrice.
      </p>

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105 text-white"
        style={{ backgroundColor: hasAudio ? '#C8A96A' : isRecording ? '#b91c1c' : '#E8E1D6' }}
      >
        {hasAudio ? <CheckCircle2 className="w-8 h-8" /> : isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>
      <p className="text-xs mt-3 text-taupe">
        {hasAudio ? 'Audio prêt' : isRecording ? 'Enregistrement en cours… touche pour arrêter' : 'Touche pour enregistrer'}
      </p>

      {previewUrl && <audio src={previewUrl} controls className="w-full mt-4" />}

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      <label className="flex items-center justify-center gap-2 mt-5 text-xs text-brunProfond underline cursor-pointer">
        <Upload size={14} />
        ou dépose un fichier audio
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
      </label>
    </div>
  );
}
