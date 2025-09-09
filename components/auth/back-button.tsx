import { Route } from 'next';
import Link from 'next/link';

interface BackButtonProps {
  label: string;
  linkLabel: string;
  href: Route;
}

export const BackButton = ({ label, linkLabel, href }: BackButtonProps) => {
  return (
    <div className="flex w-full flex-row items-center gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Link href={href} className="text-sm text-blue-600 hover:underline">
        {linkLabel}
      </Link>
    </div>
  );
};
