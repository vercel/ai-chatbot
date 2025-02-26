// spline-bg.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import Spline with SSR disabled
const SplineComponent = dynamic(
  () => import('@splinetool/react-spline/next').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
);

export default function SplineBackground() {
  return (
    <SplineComponent
      scene="https://prod.spline.design/YHaQWMaTmEmSBoOc/scene.splinecode"
    />
  );
}