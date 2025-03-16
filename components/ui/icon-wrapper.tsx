import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconWrapperProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  onClick?: () => void;
}

export const IconWrapper = ({ icon: Icon, className, size, ...props }: IconWrapperProps) => {
  return (
    <span className={className} style={{ display: 'inline-flex' }} {...props}>
      <Icon size={size} />
    </span>
  );
};