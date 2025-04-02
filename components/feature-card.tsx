import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  id: string;
}

export function FeatureCard({ icon, title, subtitle, id }: FeatureCardProps) {
  return (
    <Card
      key={id}
      className="p-4 cursor-pointer transition-all hover:scale-[1.02] 
			bg-gradient-to-br from-[#1a1a2e]/20 to-[#22223a]/20 
			rounded-2xl border border-[#2d2d45]/50
			shadow-sm hover:shadow-md"
    >
      <div
        className="bg-gradient-to-br from-[#2d2d45]/50 to-[#3d2d52]/50 
			size-8 sm:size-10 rounded-xl flex items-center justify-center shadow-sm border 
			border-[#2d2d45]"
      >
        {icon}
      </div>
      <div className="space-y-2 pt-2">
        <h3 className="font-semibold text-left text-gray-200 text-sm">
          {title}
        </h3>
        <p className="text-xs text-left text-gray-400">{subtitle}</p>
      </div>
    </Card>
  );
}
