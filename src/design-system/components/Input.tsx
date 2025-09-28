import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Input variant */
  variant?: 'default' | 'filled' | 'underlined';
  /** Whether input is required */
  required?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Whether to show password toggle (only for password type) */
  showPasswordToggle?: boolean;
  /** Additional class names for the container */
  containerClassName?: string;
  /** Additional class names for the label */
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  size = 'md',
  variant = 'default',
  required,
  leftIcon,
  rightIcon,
  showPasswordToggle,
  containerClassName,
  labelClassName,
  className,
  type = 'text',
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [internalType, setInternalType] = React.useState(type);

  // Handle password visibility toggle
  React.useEffect(() => {
    if (type === 'password' && showPasswordToggle) {
      setInternalType(showPassword ? 'text' : 'password');
    }
  }, [type, showPassword, showPasswordToggle]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    default: clsx(
      'border border-neutral-300 rounded-lg bg-white',
      'focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent',
      error && 'border-error-500 focus:ring-error-500',
      disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed'
    ),
    filled: clsx(
      'border-0 rounded-lg bg-neutral-100',
      'focus:ring-2 focus:ring-mpondo-gold-500 focus:bg-white',
      error && 'bg-error-50 focus:ring-error-500',
      disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed'
    ),
    underlined: clsx(
      'border-0 border-b-2 border-neutral-300 rounded-none bg-transparent px-0',
      'focus:ring-0 focus:border-mpondo-gold-500',
      error && 'border-error-500 focus:border-error-500',
      disabled && 'text-neutral-500 cursor-not-allowed'
    ),
  };

  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={clsx('w-full', containerClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'block text-sm font-medium text-neutral-700 mb-1',
            disabled && 'text-neutral-500',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={internalType}
          disabled={disabled}
          className={clsx(
            'w-full transition-colors duration-200',
            'placeholder:text-neutral-400',
            sizeClasses[size],
            variantClasses[variant],
            leftIcon && 'pl-10',
            (rightIcon || (type === 'password' && showPasswordToggle) || error) && 'pr-10',
            className
          )}
        />

        {/* Right Icon or Password Toggle */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {error && (
            <AlertCircle className="w-4 h-4 text-error-500" />
          )}
          
          {type === 'password' && showPasswordToggle && !error && (
            <button
              type="button"
              onClick={handlePasswordToggle}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          
          {rightIcon && !error && !(type === 'password' && showPasswordToggle) && (
            <div className="text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={clsx(
          'mt-1 text-xs',
          error ? 'text-error-600' : 'text-neutral-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;