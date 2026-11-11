import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Square, Play, Pause, Trash2, Upload, AlertCircle, 
  Image as ImageIcon, Video, FileText, Check, Eye, X, Camera, Film
} from 'lucide-react';
import { AttachedMediaItem } from '../types/index.ts';

interface MediaIntakeProps {
  onAudioReady: (base64: string, mimeType: string, durationSec: number) => void;
  onClearAudio: () => void;
  existingAudio?: string | null;
  attachedMedia: AttachedMediaItem[];
  onAddMedia: (item: AttachedMediaItem) => void;
  onRemoveMedia: (id: string) => void;
}

export const MediaIntake: React.FC<MediaIntakeProps> = ({
  onAudioReady,
  onClearAudio,
  existingAudio,
  attachedMedia,
  onAddMedia,
  onRemoveMedia,
}) => {
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackTime, setAudioPlaybackTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preview modal for images / videos
  const [previewItem, setPreviewItem] = useState<AttachedMediaItem | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Audio Recording
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

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          onAudioReady(base64Data, mimeType, recordingDuration);
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access denied. You can still upload audio, image, or video files below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file (.png, .jpg, .jpeg, .webp).');
        return;
      }

      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onAddMedia({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: 'image',
          mimeType: file.type,
          dataUrl,
          sizeStr,
          description: 'Customer attached error/hardware screenshot',
        });
      };
    });

    if (e.target) e.target.value = '';
  };

  // Video Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please select a valid video file (.mp4, .webm, .mov).');
        return;
      }

      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onAddMedia({
          id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: 'video',
          mimeType: file.type,
          dataUrl,
          sizeStr,
          description: 'Customer attached video of symptom / beep codes',
        });
      };
    });

    if (e.target) e.target.value = '';
  };

  // Sample Image Helper (Generates realistic diagnostic diagram/BSOD test card)
  const handleAttachSampleBSOD = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Blue screen background
      ctx.fillStyle = '#0078d7';
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(':(', 40, 60);
      ctx.font = '16px monospace';
      ctx.fillText('Your PC ran into a problem and needs to restart.', 40, 110);
      ctx.fillText('We\'re just collecting some error info, and then you can restart.', 40, 135);
      ctx.font = '14px monospace';
      ctx.fillText('Stop Code: CRITICAL_PROCESS_DIED', 40, 200);
      ctx.fillText('What failed: ntoskrnl.exe / disk_drive_0', 40, 225);
      ctx.fillText('QR Code Scan: http://windows.com/stopcode', 40, 250);
      // Small simulated QR box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 275, 50, 50);
      ctx.fillStyle = '#0078d7';
      ctx.fillRect(45, 280, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(52, 287, 26, 26);
    }
    const sampleDataUrl = canvas.toDataURL('image/png');
    onAddMedia({
      id: `img-${Date.now()}`,
      name: 'Client_BSOD_StopCode_Photo.png',
      type: 'image',
      mimeType: 'image/png',
      dataUrl: sampleDataUrl,
      sizeStr: '74 KB',
      description: 'Customer photo of Blue Screen error code (CRITICAL_PROCESS_DIED)',
    });
  };

  const handleClearAudioData = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlayingAudio(false);
    setRecordingDuration(0);
    setAudioPlaybackTime(0);
    onClearAudio();
  };

  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const imagesCount = attachedMedia.filter(m => m.type === 'image').length;
  const videosCount = attachedMedia.filter(m => m.type === 'video').length;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Multi-Modal Intake (Voice, Images & Video)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {attachedMedia.length > 0 && (
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full">
              {imagesCount > 0 && `${imagesCount} Photo${imagesCount > 1 ? 's' : ''}`}
              {imagesCount > 0 && videosCount > 0 && ' • '}
              {videosCount > 0 && `${videosCount} Video${videosCount > 1 ? 's' : ''}`}
            </span>
          )}
          {audioUrl && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              Voice Note Attached
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-950/50 border border-rose-800/60 p-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Buttons row: Voice recording + Audio upload + Image upload + Video upload */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. Record Audio */}
        {!audioUrl ? (
          !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" /> Record Voice Memo
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-red-950/40 animate-pulse transition-all cursor-pointer"
            >
              <Square className="w-4 h-4" /> Stop Recording ({formatSeconds(recordingDuration)})
            </button>
          )
        ) : null}

        {/* 2. Upload Audio File */}
        {!audioUrl && (
          <div className="relative">
            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioUpload}
            />
            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-750 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload Audio (.m4a, .mp3, .wav)
            </button>
          </div>
        )}

        {/* 3. Upload Photos / Screenshots */}
        <div className="relative">
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => imageFileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 px-3.5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Upload Image / Photo</span>
          </button>
        </div>

        {/* 4. Upload Video Clips */}
        <div className="relative">
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleVideoUpload}
          />
          <button
            type="button"
            onClick={() => videoFileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-indigo-800/80 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 px-3.5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Video className="w-4 h-4 text-indigo-400" />
            <span>Upload Video Clip</span>
          </button>
        </div>

        {/* Quick test sample button for testing multimodal vision */}
        <button
          type="button"
          onClick={handleAttachSampleBSOD}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 px-2.5 py-2 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Generates a sample BSOD error code photo to test Gemini vision analysis"
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Add Sample BSOD Photo</span>
        </button>
      </div>

      {/* Audio Player Card (if audio attached) */}
      {audioUrl && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-800/90 border border-slate-700 p-3">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onTimeUpdate={() => setAudioPlaybackTime(Math.floor(audioElementRef.current?.currentTime || 0))}
            onEnded={() => setIsPlayingAudio(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-medium text-slate-200">Customer Audio Note Attached</div>
              <div className="text-[11px] font-mono text-cyan-400">
                {isPlayingAudio ? `Playing: ${formatSeconds(audioPlaybackTime)}` : 'Ready for Gemini Whisper transcription'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 text-[11px] font-medium text-cyan-300">
              <Mic className="w-3 h-3" /> Voice Memo
            </span>
            <button
              type="button"
              onClick={handleClearAudioData}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              title="Remove audio memo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Attached Media Cards Grid (Images & Videos) */}
      {attachedMedia.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>Customer Diagnostic Evidence ({attachedMedia.length} Files Attached)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {attachedMedia.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-700 bg-slate-950/80 overflow-hidden flex flex-col hover:border-cyan-500/70 transition-all shadow-sm"
              >
                {/* Media Thumbnail */}
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-indigo-400">
                      <Film className="w-7 h-7 mb-1" />
                      <span className="text-[10px] font-mono">Video Clip</span>
                    </div>
                  )}

                  {/* Overlay buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 rounded-lg bg-slate-800/90 text-white hover:bg-cyan-600 transition-colors cursor-pointer"
                      title="Inspect full resolution"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveMedia(item.id)}
                      className="p-1.5 rounded-lg bg-slate-800/90 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Badge */}
                  <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow ${
                    item.type === 'image' ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-800' : 'bg-indigo-950/90 text-indigo-300 border border-indigo-800'
                  }`}>
                    {item.type === 'image' ? 'Photo' : 'Video'}
                  </span>
                </div>

                {/* Info Footer */}
                <div className="p-2 flex items-center justify-between text-[11px] bg-slate-900/60">
                  <div className="truncate flex-1 pr-1 font-medium text-slate-300 text-[10px]" title={item.name}>
                    {item.name}
                  </div>
                  {item.sizeStr && (
                    <div className="text-[9px] font-mono text-slate-500 shrink-0">
                      {item.sizeStr}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal for full inspection */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{previewItem.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {previewItem.sizeStr}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
              {previewItem.type === 'image' ? (
                <img
                  src={previewItem.dataUrl}
                  alt={previewItem.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={previewItem.dataUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg"
                />
              )}
            </div>

            {previewItem.description && (
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                {previewItem.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
