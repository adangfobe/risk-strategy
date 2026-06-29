'use client';

import { useCallback, useRef, useState } from 'react';

interface StrategyRecorderProps {
  label: string;
  side: 'attacker' | 'defender';
  value: string;
  onChange: (text: string) => void;
  accentClass?: string;
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export default function StrategyRecorder({
  label,
  side,
  value,
  onChange,
  accentClass = 'border-blue-500',
}: StrategyRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef('');

  const transcribe = useCallback(
    async (blob: Blob, mimeType: string) => {
      setIsTranscribing(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('audio', blob, `strategy.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`);
        formData.append('mimeType', mimeType);

        const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Transcription failed');

        onChange(data.transcript || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transcription failed');
      } finally {
        setIsTranscribing(false);
      }
    },
    [onChange]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || 'audio/webm',
        });
        transcribe(blob, mimeTypeRef.current || 'audio/webm');
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError('Microphone access denied. Type your strategy below instead.');
    }
  }, [transcribe]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const sideColor =
    side === 'attacker'
      ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
      : 'bg-red-600 hover:bg-red-700 active:bg-red-800';

  return (
    <div className={`rounded-lg border-2 p-4 ${accentClass}`}>
      <h3 className="mb-3 text-lg font-semibold">{label}</h3>

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
        className={`mb-3 min-h-[44px] w-full rounded-lg px-4 py-3 text-base font-medium text-white transition-colors disabled:opacity-50 ${sideColor}`}
      >
        {isTranscribing
          ? 'Transcribing…'
          : isRecording
            ? '⏹ Stop & Transcribe'
            : '🎤 Record Strategy'}
      </button>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <label htmlFor={`strategy-${side}`} className="mb-1 block text-sm text-gray-600">
        Strategy (editable)
      </label>
      <textarea
        id={`strategy-${side}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Describe your ${side} strategy…`}
        rows={4}
        className="w-full rounded-lg border border-gray-300 p-3 text-base leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
