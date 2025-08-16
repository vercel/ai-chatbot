import Image from 'next/image';

export function BrianLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/images/brian.png"
      alt="Brian"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
}