import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, X, ArrowRight, Bell } from 'lucide-react';
import { smartNotificationsService, type SmartNotification } from '../../services/smart-notifications.service';

interface AlertsDropdownProps {
  onNavigate: (page: string, sectionId?: string) => void;
  onClose?: () => void;
}

const getTypeStyles = (type: SmartNotification['type']) => {
  switch (type) {
    case 'urgent':
      return 'border-status-error-200 bg-status-error-50';
    case 'attention':
      return 'border-status-warning-200 bg-status-warning-50';
    case 'success':
      return 'border-status-success-200 bg-status-success-50';
    default:
      return 'border-neutral-200 bg-neutral-50';
  }
};

export const AlertsDropdown: React.FC<AlertsDropdownProps> = ({ onNavigate, onClose }) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  useEffect(() => {
    const unsubscribe = smartNotificationsService.subscribe((list) => setNotifications(list));
    return () => unsubscribe();
  }, []);

  const markRead = useCallback((id: string) => {
    smartNotificationsService.markAsRead(id);
  }, []);

  const dismiss = useCallback((id: string) => {
    smartNotificationsService.removeNotification(id);
  }, []);

  const handleAction = useCallback((n: SmartNotification) => {
    if (!n.actionable || !n.actions || n.actions.length === 0) return;
    const primary = n.actions[0];
    if (primary.action === 'navigate' && primary.target) {
      onNavigate(primary.target, n.relatedId || undefined);
      smartNotificationsService.markAsRead(n.id);
      onClose?.();
    } else if (primary.action === 'api_call' && primary.parameters?.service && primary.parameters?.method) {
      try {
        const svc = (smartNotificationsService as any);
        if (svc && typeof svc[primary.parameters.service]?.[primary.parameters.method] === 'function') {
          svc[primary.parameters.service][primary.parameters.method](primary.parameters.args);
          smartNotificationsService.markAsRead(n.id);
        }
      } catch (err) {
        console.warn('AlertsDropdown api_call failed', err);
      }
    } else if (primary.action === 'dismiss') {
      smartNotificationsService.removeNotification(n.id);
    } else if (primary.action === 'snooze') {
      // Simple snooze: mark read and re-add later could be implemented; for now just mark read
      smartNotificationsService.markAsRead(n.id);
    }
  }, [onNavigate, onClose]);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-neutral-700" />
          <span className="text-sm font-medium text-neutral-900">Alerts</span>
        </div>
        <button className="p-1 hover:bg-neutral-100 rounded" onClick={onClose} aria-label="Close alerts">
          <X className="w-4 h-4 text-neutral-600" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-neutral-600">No alerts right now</div>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <div key={n.id} className={`px-3 py-2 border-t ${getTypeStyles(n.type)} flex items-start gap-3`}> 
              {n.type === 'urgent' ? (
                <AlertTriangle className="w-4 h-4 text-status-error-600 mt-1" />
              ) : n.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-status-success-600 mt-1" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-neutral-500 mt-1" />
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                  <span className="text-xs text-neutral-500">{new Date(n.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-neutral-700 mt-1">{n.message}</p>

                <div className="mt-2 flex items-center gap-2">
                  {!n.read && (
                    <button className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded" onClick={() => markRead(n.id)}>Mark read</button>
                  )}
                  <button className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded" onClick={() => dismiss(n.id)}>Dismiss</button>
                  {n.actionable && (
                    <button className="text-xs px-2 py-1 bg-mpondo-gold-100 text-mpondo-gold-700 hover:bg-mpondo-gold-200 rounded inline-flex items-center gap-1" onClick={() => handleAction(n)}>
                      Act <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsDropdown;