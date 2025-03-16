import React from 'react';
import { IconNode } from 'lucide-react';

interface IconWrapperProps {
  icon: IconNode;
  className?: string;
  size?: number;
}

export const IconWrapper = ({ icon: Icon, className, size, ...props }: IconWrapperProps) => {
  return (
    <span className={className} style={{ display: 'inline-flex' }}>
      <Icon size={size} {...props} />
    </span>
  );
};
