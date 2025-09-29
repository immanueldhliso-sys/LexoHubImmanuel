/**
 * Feature Discovery Notification Component
 * Shows users information about available advanced features
 */

import React, { useState, useEffect } from 'react';
import { X, Zap, ArrowRight, Settings } from 'lucide-react';
import { Card, CardContent, Button } from '../../design-system/components';
import { userPreferencesService } from '../../services/api/user-preferences.service';
import { toast } from 'react-hot-toast';

interface FeatureDiscoveryNotificationProps {
  onNavigateToSettings?: () => void;
  className?: string;
}

export const FeatureDiscoveryNotification: React.FC<FeatureDiscoveryNotificationProps> = ({
  onNavigateToSettings,
  className = ''
}) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = async () => {
    try {
      const response = await userPreferencesService.shouldShowFeatureNotification();
      
      if (response.error) {
        console.error('Error checking feature notification:', response.error);
        setLoading(false);
        return;
      }

      setVisible(response.data || false);
    } catch (error) {
      console.error('Error checking feature notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    
    try {
      const response = await userPreferencesService.dismissNotification();
      
      if (response.error) {
        console.error('Error dismissing notification:', response.error);
        toast.error('Failed to dismiss notification');
        return;
      }

      setVisible(false);
      toast.success('Notification dismissed');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
    } finally {
      setDismissing(false);
    }
  };

  const handleExploreFeatures = async () => {
    try {
      // Mark as shown when user clicks to explore
      await userPreferencesService.markNotificationShown();
      
      if (onNavigateToSettings) {
        onNavigateToSettings();
      } else {
        // Fallback navigation
        window.location.hash = 'settings';
      }
      
      setVisible(false);
    } catch (error) {
      console.error('Error marking notification as shown:', error);
    }
  };

  // Don't render anything while loading or if not visible
  if (loading || !visible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <Card className="shadow-lg border-l-4 border-l-mpondo-gold-500 bg-gradient-to-r from-mpondo-gold-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-mpondo-gold-100 rounded-full">
                <Zap className="w-4 h-4 text-mpondo-gold-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">
                Unlock Advanced Features
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
            You've been using Lexo for a week! Discover powerful advanced features like 
            AI analytics, strategic finance tools, and workflow integrations.
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExploreFeatures}
              className="flex items-center gap-1 text-xs"
            >
              <Settings className="w-3 h-3" />
              Explore Features
              <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDismiss}
              disabled={dismissing}
              className="text-xs"
            >
              {dismissing ? 'Dismissing...' : 'Maybe Later'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Hook for managing feature discovery notification
 */
export const useFeatureDiscoveryNotification = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const response = await userPreferencesService.shouldShowFeatureNotification();
      
      if (response.data) {
        setShouldShow(true);
      }
      // Silence expected missing-table state
      // If the service suppressed a schema-cache error, response.error will be null
      // and response.data will be false, which we treat as "do not show".
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = async () => {
    try {
      await userPreferencesService.dismissNotification();
      setShouldShow(false);
      return true;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  };

  const markAsShown = async () => {
    try {
      await userPreferencesService.markNotificationShown();
      setShouldShow(false);
      return true;
    } catch (error) {
      console.error('Error marking notification as shown:', error);
      return false;
    }
  };

  return {
    shouldShow,
    loading,
    dismissNotification,
    markAsShown,
    checkNotificationStatus
  };
};

export default FeatureDiscoveryNotification;