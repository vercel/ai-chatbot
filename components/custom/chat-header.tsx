import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function ChatHeader({ showAvatar = true }: { showAvatar?: boolean }) {
  return (
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2">
      <Link href="/">
        <ChevronLeft />
      </Link>
      {showAvatar && (
        <Image src="/images/aura.png" alt="Aura" height={40} width={40} />
      )}
    </header>
  );
}
