"use client";

import { useState, useCallback, useRef } from "react";

interface TrackUploaderProps {
  onUploadComplete?: (track: unknown) => void;
  onError?: (error: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "processing" | "uploading" | "done" | "error";
  error?: string;
  peaks?: number[];
}

async function generatePeaks(audioBuffer: AudioBuffer, numPeaks = 200): Promise<number[]> {
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerPeak = Math.floor(channelData.length / numPeaks);
  const peaks: number[] = [];
  for (let i = 0; i < numPeaks; i++) {
    let max = 0;
    const start = i * samplesPerPeak;
    for (let j = start; j < start + samplesPerPeak && j < channelData.length; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }
  return peaks;
}

export default function TrackUploader({ onUploadComplete, onError }: TrackUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const allowedExts = ["wav", "flac", "mp3", "aiff"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExts.includes(ext)) {
      onError?.(`Invalid file type: ${file.name}. Allowed: WAV, FLAC, MP3, AIFF`);
      return;
    }

    const entry: UploadingFile = { file, progress: 0, status: "processing" };
    setUploading((prev) => [...prev, entry]);

    let peaks: number[] | undefined;

    // Generate waveform peaks client-side
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      peaks = await generatePeaks(audioBuffer, 200);
      audioContext.close();
    } catch {
      // Peaks generation failed, continue without
    }

    // Upload
    setUploading((prev) =>
      prev.map((e) =>
        e.file === file ? { ...e, status: "uploading" as const, progress: 10, peaks } : e
      )
    );

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("role", "mix_engineer");
    formData.append("is_public", "true");
    if (peaks) {
      formData.append("waveform_peaks", JSON.stringify(peaks));
    }

    try {
      const res = await fetch("/api/portfolio/tracks", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUploading((prev) =>
        prev.map((e) => (e.file === file ? { ...e, status: "done" as const, progress: 100 } : e))
      );
      onUploadComplete?.(data.track);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploading((prev) =>
        prev.map((e) =>
          e.file === file ? { ...e, status: "error" as const, error: msg } : e
        )
      );
      onError?.(msg);
    }
  }, [onUploadComplete, onError]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach(processFile);
    },
    [processFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? "drop-zone-active border-[#D4A843] bg-[#D4A843]/5"
            : "drop-zone-idle border-[#3A2818]/60 hover:border-[#3A2818]"
        }`}
      >
        <div className="text-3xl mb-3">🎙️</div>
        <p className="text-[#F0E6D3]/60 font-[family-name:var(--font-mono)] text-sm mb-1">
          Drop audio files here or click to browse
        </p>
        <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs">
          WAV, FLAC, MP3, AIFF — Max 50MB (Pro) / 100MB (Studio)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.flac,.mp3,.aiff,audio/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((entry, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-[#1A0F0A]/80 border border-[#3A2818]/40 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[#F0E6D3] font-[family-name:var(--font-mono)] text-xs truncate">
                  {entry.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-[10px]">
                    {formatSize(entry.file.size)}
                  </span>
                  {entry.status === "uploading" && (
                    <div className="flex-1 h-1 bg-[#2A1810] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4A843] to-[#E89B2E] transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {entry.status === "processing" && (
                  <span className="text-[#D4A843] font-[family-name:var(--font-mono)] text-[10px]">Processing...</span>
                )}
                {entry.status === "uploading" && (
                  <span className="text-[#D4A843] font-[family-name:var(--font-mono)] text-[10px]">Uploading...</span>
                )}
                {entry.status === "done" && (
                  <span className="text-green-500 font-[family-name:var(--font-mono)] text-[10px]">✓ Done</span>
                )}
                {entry.status === "error" && (
                  <span className="text-red-400 font-[family-name:var(--font-mono)] text-[10px]">✗ {entry.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
