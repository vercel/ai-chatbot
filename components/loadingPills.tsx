import { Loader } from 'lucide-react';

export default function LoadingPill({
  seconds = 0,
  text,
}: {
  seconds?: number;
  text?: string;
}) {
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 px-2 py-1 bg-black rounded-full w-fit h-7">
      <Loader className="animate-spin h-4 w-5 text-yellow-500" />
      <span className="text-white text-[10px] font-medium leading-none">
        {text ?? `Recording ${formatTime(seconds)}`}
      </span>
    </div>
  );
}
