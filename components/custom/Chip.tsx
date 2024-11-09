import { ReactNode } from 'react';

export default function Chip({
  variant,
  children,
}: {
  variant: 'positive' | 'negative';
  children: ReactNode;
}) {
  const variantClassName =
    variant === 'positive'
      ? 'border-green-500 bg-green-100'
      : 'border-red-500 bg-red-100';

  return (
    <div
      className={`px-3 py-1 rounded-full border text-sm text-black ${variantClassName}`}
    >
      {children}
    </div>
  );
}
