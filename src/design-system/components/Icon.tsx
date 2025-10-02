/**
 * Icon Component
 * 
 * A centralized wrapper for Lucide React icons that applies gradient styling by default.
 * This component ensures consistent icon styling across the application while maintaining
 * flexibility for custom overrides.
 * 
 * Features:
 * - Gradient styling by default using brand colors
 * - Optional solid color override with noGradient prop
 * - Full compatibility with LucideProps
 * - Intelligent class merging with twMerge and clsx
 * 
 * @example
 * ```tsx
 * // Gradient icon (default)
 * <Icon icon={Rocket} size={24} />
 * 
 * // Solid color icon
 * <Icon icon={XCircle} size={24} noGradient className="text-red-500" />
 * ```
 */

import React from 'react';
import { type LucideProps } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Define the props for our custom Icon component
interface IconProps extends LucideProps {
  /** The actual icon component from lucide-react, like `CheckCircle` */
  icon: React.ElementType;
  /** An optional className to allow for custom overrides */
  className?: string;
  /** A prop to disable the gradient for specific icons */
  noGradient?: boolean;
}

export const Icon = ({ 
  icon: LucideIcon, 
  className, 
  noGradient = false, 
  ...props 
}: IconProps) => {
  const iconClasses = twMerge(
    clsx(
      {
        'text-gradient-icon': !noGradient,
      },
      className,
    ),
  );

  return <LucideIcon className={iconClasses} {...props} />;
};

export type { IconProps };