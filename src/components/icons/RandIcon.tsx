import React from 'react';

export interface RandIconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * South African Rand (ZAR) currency icon
 * Uses the official R symbol for the South African Rand
 */
export const RandIcon: React.FC<RandIconProps> = ({ 
  size = 24, 
  className = '', 
  color = 'currentColor' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* South African Rand symbol (R) with distinctive styling */}
      <path
        d="M6 4h6.5a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H9.5l3.5 4M6 8h8M6 12h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Smaller variant for inline use
 */
export const RandIconSmall: React.FC<Omit<RandIconProps, 'size'>> = (props) => (
  <RandIcon size={16} {...props} />
);

/**
 * Large variant for prominent display
 */
export const RandIconLarge: React.FC<Omit<RandIconProps, 'size'>> = (props) => (
  <RandIcon size={32} {...props} />
);

export default RandIcon;
