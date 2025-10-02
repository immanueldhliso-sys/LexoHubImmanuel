import React, { useState } from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { Button } from '../../design-system/components';
import { Lock, X, ArrowUpCircle } from 'lucide-react';

interface RestrictedActionButtonProps {
  actionKey: string;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const RestrictedActionButton: React.FC<RestrictedActionButtonProps> = ({
  actionKey,
  onClick,
  children,
  variant = 'primary',
  className,
  size = 'md',
  disabled = false,
}) => {
  const { canPerformAction } = useRBAC();
  const [showModal, setShowModal] = useState(false);
  
  const { allowed, message } = canPerformAction(actionKey);

  const handleClick = () => {
    if (allowed) {
      onClick();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
      >
        {!allowed && <Lock className="w-4 h-4 mr-2" />}
        {children}
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>

            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-mpondo-gold-100 rounded-full">
                <Lock className="w-8 h-8 text-mpondo-gold-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-neutral-900 text-center mb-2">
              Premium Feature
            </h2>

            <p className="text-neutral-600 text-center mb-6">
              {message || 'This action requires Senior Counsel access.'}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-neutral-900 mb-2">
                Upgrade to Senior Counsel
              </h3>
              <ul className="space-y-1 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
                  Full delete permissions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
                  AI-powered features
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
                  Strategic finance tools
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-mpondo-gold-600 rounded-full"></div>
                  Advanced reporting
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  window.location.hash = 'settings';
                }}
                variant="primary"
                className="flex-1 inline-flex items-center justify-center gap-2"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
