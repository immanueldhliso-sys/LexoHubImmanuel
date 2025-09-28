import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the card is interactive/clickable */
  interactive?: boolean;
  /** Whether to show hover effects */
  hoverable?: boolean;
  /** Card content */
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      interactive = false,
      hoverable = false,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-lg transition-all duration-200 ease-in-out',
    ];

    const variantClasses = {
      default: [
        'bg-white border border-neutral-200',
      ],
      elevated: [
        'bg-white shadow-md border border-neutral-100',
      ],
      outlined: [
        'bg-transparent border-2 border-neutral-300',
      ],
      ghost: [
        'bg-neutral-50 border-0',
      ],
    };

    const sizeClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const interactiveClasses = interactive || onClick ? [
      'cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mpondo-gold-400 focus-visible:ring-offset-2',
    ] : [];

    const hoverClasses = (hoverable || interactive || onClick) ? [
      'hover:shadow-md hover:-translate-y-0.5',
      variant === 'outlined' ? 'hover:border-mpondo-gold-300' : 'hover:border-neutral-300',
    ] : [];

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((interactive || onClick) && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick?.(event as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          interactiveClasses,
          hoverClasses,
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive || onClick ? 0 : undefined}
        role={interactive || onClick ? 'button' : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-start justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex-1', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-center justify-between mt-4 pt-4 border-t border-neutral-200', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export default Card;