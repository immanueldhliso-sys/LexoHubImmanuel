import React from 'react';
import { LucideIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

interface IconProps {
  icon: LucideIcon;
  noGradient?: boolean;
  className?: string;
  size?: number;
  [key: string]: any;
}

export const Icon: React.FC<IconProps> = ({ 
  icon: IconComponent, 
  noGradient = false, 
  className,
  ...props 
}) => {
  return (
    <IconComponent
      className={twMerge(
        clsx(
          !noGradient && 'text-gradient-icon',
          className
        )
      )}
      {...props}
    />
  );
};