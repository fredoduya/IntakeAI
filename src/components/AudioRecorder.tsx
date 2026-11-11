import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (base64: string, mimeType: string, durationSec: number) => void;
  onClearAudio: () => void;
  existingAudio?: string | null;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  onClearAudio,
  existingAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          onAudioReady(base64Data, mimeType, recordingDuration);
        };

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMsg('Microphone access denied or not available. You can also upload an audio file below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Please select a valid audio file (.wav, .mp3, .m4a, .webm, .ogg).');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      onAudioReady(base64Data, file.type, 0);
    };
  };

  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleClear = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingDuration(0);
    setPlaybackTime(0);
    onClearAudio();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Voice Note / Phone Memo Intake
          </span>
        </div>
        {audioUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Audio
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-950/50 border border-rose-800/60 p-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!audioUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" /> Record Voice Memo
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-red-900/40 animate-pulse transition-all cursor-pointer"
            >
              <Square className="w-4 h-4" /> Stop Recording ({formatSeconds(recordingDuration)})
            </button>
          )}

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload Audio (.m4a, .mp3, .wav)
            </button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-1 text-xs text-red-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Recording live microphone audio...
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-800/90 border border-slate-700 p-3">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onTimeUpdate={() => setPlaybackTime(Math.floor(audioElementRef.current?.currentTime || 0))}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-medium text-slate-200">Customer Audio Note Attached</div>
              <div className="text-[11px] font-mono text-cyan-400">
                {isPlaying ? `Playing: ${formatSeconds(playbackTime)}` : 'Ready for Gemini Whisper/Transcription engine'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 text-[11px] font-medium text-cyan-300">
            <Mic className="w-3 h-3" /> Audio Attached
          </div>
        </div>
      )}
    </div>
  );
};
