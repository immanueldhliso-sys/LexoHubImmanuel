import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Button content */
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center gap-2',
      'font-medium rounded-lg transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    ];

    const variantClasses = {
      primary: [
        'bg-mpondo-gold-500 text-white shadow-sm',
        'hover:bg-mpondo-gold-600 active:bg-mpondo-gold-700',
        'focus-visible:ring-mpondo-gold-400',
      ],
      secondary: [
        'bg-judicial-blue-900 text-white shadow-sm',
        'hover:bg-judicial-blue-800 active:bg-judicial-blue-700',
        'focus-visible:ring-judicial-blue-400',
      ],
      outline: [
        'border border-neutral-300 bg-white text-neutral-700 shadow-sm',
        'hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100',
        'focus-visible:ring-neutral-400',
      ],
      ghost: [
        'text-neutral-700 bg-transparent',
        'hover:bg-neutral-100 active:bg-neutral-200',
        'focus-visible:ring-neutral-400',
      ],
      destructive: [
        'bg-red-600 text-white shadow-sm',
        'hover:bg-red-700 active:bg-red-800',
        'focus-visible:ring-red-400',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClasses,
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        <span>{children}</span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;