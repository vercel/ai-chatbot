import { PlayIcon, PauseIcon, LoaderIcon, X, MicIcon } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';

export const AudioAttachments = ({
  url,
  onCancel,
  isUploading = false,
}: {
  url: string;
  isUploading?: boolean;
  onCancel?: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.play() : audio.pause();
  }, [isPlaying]);

  const formatTime = (time: number) =>
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
  const waveformBars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      const height = 6 + (Math.sin(i * 0.5) + 1) * 6;
      const time = i / 50;
      return {
        id: `bar-${time.toFixed(3)}-${height.toFixed(1)}`, // ✅ Unique, stable key
        height,
        time,
      };
    });
  }, []);

  return (
    <div className="flex items-center bg-black gap-3 px-3 py-2  shadow w-[420px]">
      <audio ref={audioRef} src={url} hidden preload="metadata" />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={() => setIsPlaying((prev) => !prev)}
        className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4" />
        )}
      </button>

      {/* WhatsApp-style waveform */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative h-6 overflow-hidden">
          <div className="absolute inset-0 flex gap-[2px] items-end">
            {waveformBars.map(({ id, height, time }) => {
              const barTime = time * duration;
              const active = currentTime >= barTime;

              return (
                <div
                  key={id}
                  className={`w-[2px] rounded-sm transition-all duration-200 ${
                    active ? 'bg-zinc-300' : 'bg-zinc-300'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-1 flex justify-end text-[11px] text-white">
          <span>{formatTime(currentTime)}</span>
          {/* <span>{formatTime(duration)}</span> */}
        </div>
      </div>

      {/* Mic Avatar */}
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute bottom-0 bg-black right-0 rounded-full p-[2px]">
          <MicIcon size={14} color="white" />
        </div>
        <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Cancel or loader */}
      {isUploading ? (
        <LoaderIcon className="w-4 h-4 animate-spin text-zinc-400" />
      ) : onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-zinc-400 hover:text-red-500 transition"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
};
