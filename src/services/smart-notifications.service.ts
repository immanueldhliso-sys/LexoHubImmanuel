import type { Page } from '../types';

export interface SmartNotification {
  id: string;
  type: 'urgent' | 'attention' | 'info' | 'success';
  category: 'deadline' | 'invoice' | 'matter' | 'court_date' | 'client' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actions?: NotificationAction[];
  relatedPage?: Page;
  relatedId?: string;
  priority: number; // 1-10, 10 being highest
  expiresAt?: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'navigate' | 'api_call' | 'dismiss' | 'snooze';
  target?: string;
  parameters?: Record<string, any>;
}

export interface NotificationBadge {
  page: Page;
  count: number;
  hasUrgent: boolean;
  highestPriority: number;
}

export interface NotificationFilters {
  types?: SmartNotification['type'][];
  categories?: SmartNotification['category'][];
  read?: boolean;
  priority?: { min?: number; max?: number };
  dateRange?: { start: Date; end: Date };
}

export interface NotificationMetrics {
  total: number;
  unread: number;
  urgent: number;
  byCategory: Record<SmartNotification['category'], number>;
  byPage: Record<Page, number>;
}

class SmartNotificationsService {
  private notifications: SmartNotification[] = [];
  private subscribers: ((notifications: SmartNotification[]) => void)[] = [];
  private badgeSubscribers: ((badges: NotificationBadge[]) => void)[] = [];
  private metricsSubscribers: ((metrics: NotificationMetrics) => void)[] = [];
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeNotifications();
    this.startAutoRefresh();
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: SmartNotification[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.notifications);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Subscribe to badge updates
   */
  subscribeToBadges(callback: (badges: NotificationBadge[]) => void): () => void {
    this.badgeSubscribers.push(callback);
    callback(this.calculateBadges());
    
    return () => {
      this.badgeSubscribers = this.badgeSubscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribeToMetrics(callback: (metrics: NotificationMetrics) => void): () => void {
    this.metricsSubscribers.push(callback);
    callback(this.calculateMetrics());
    
    return () => {
      this.metricsSubscribers = this.metricsSubscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Get notifications with optional filtering
   */
  getNotifications(filters?: NotificationFilters): SmartNotification[] {
    let filtered = [...this.notifications];

    if (filters) {
      if (filters.types) {
        filtered = filtered.filter(n => filters.types!.includes(n.type));
      }

      if (filters.categories) {
        filtered = filtered.filter(n => filters.categories!.includes(n.category));
      }

      if (typeof filters.read === 'boolean') {
        filtered = filtered.filter(n => n.read === filters.read);
      }

      if (filters.priority) {
        if (filters.priority.min !== undefined) {
          filtered = filtered.filter(n => n.priority >= filters.priority!.min!);
        }
        if (filters.priority.max !== undefined) {
          filtered = filtered.filter(n => n.priority <= filters.priority!.max!);
        }
      }

      if (filters.dateRange) {
        filtered = filtered.filter(n => 
          n.timestamp >= filters.dateRange!.start && 
          n.timestamp <= filters.dateRange!.end
        );
      }
    }

    // Remove expired notifications
    const now = new Date();
    filtered = filtered.filter(n => !n.expiresAt || n.expiresAt > now);

    // Sort by priority and timestamp
    return filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return b.timestamp.getTime() - a.timestamp.getTime(); // Newer first
    });
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read'>): string {
    const newNotification: SmartNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.notifySubscribers();
    
    return newNotification.id;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(filters?: NotificationFilters): number {
    const notifications = this.getNotifications(filters);
    let count = 0;

    notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    });

    if (count > 0) {
      this.notifySubscribers();
    }

    return count;
  }

  /**
   * Remove notification
   */
  removeNotification(notificationId: string): boolean {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  /**
   * Execute notification action
   */
  async executeAction(notificationId: string, actionId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification || !notification.actions) {
      return false;
    }

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) {
      return false;
    }

    try {
      switch (action.action) {
        case 'dismiss':
          this.removeNotification(notificationId);
          break;

        case 'snooze':
          // Snooze for 1 hour by default
          const snoozeMinutes = action.parameters?.minutes || 60;
          notification.expiresAt = new Date(Date.now() + snoozeMinutes * 60 * 1000);
          this.notifySubscribers();
          break;

        case 'navigate':
          // This would be handled by the UI component
          this.markAsRead(notificationId);
          break;

        case 'api_call':
          // This would make an API call based on action.target and parameters
          console.log('API call action:', action.target, action.parameters);
          this.markAsRead(notificationId);
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to execute notification action:', error);
      return false;
    }
  }

  /**
   * Get notification badges for navigation items
   */
  getNotificationBadges(): NotificationBadge[] {
    return this.calculateBadges();
  }

  /**
   * Get notification metrics
   */
  getNotificationMetrics(): NotificationMetrics {
    return this.calculateMetrics();
  }

  /**
   * Calculate notification badges for each page
   */
  private calculateBadges(): NotificationBadge[] {
    const badges: Record<Page, NotificationBadge> = {} as Record<Page, NotificationBadge>;
    const unreadNotifications = this.notifications.filter(n => !n.read);

    // Initialize badges for all pages
    const pages: Page[] = ['dashboard', 'matters', 'finance', 'practice-growth', 'ai-analytics', 'academy', 'settings', 'reports', 'compliance'];
    
    pages.forEach(page => {
      badges[page] = {
        page,
        count: 0,
        hasUrgent: false,
        highestPriority: 0
      };
    });

    // Calculate badges based on notifications
    unreadNotifications.forEach(notification => {
      const page = this.mapNotificationToPage(notification);
      if (page && badges[page]) {
        badges[page].count++;
        
        if (notification.type === 'urgent') {
          badges[page].hasUrgent = true;
        }
        
        if (notification.priority > badges[page].highestPriority) {
          badges[page].highestPriority = notification.priority;
        }
      }
    });

    return Object.values(badges).filter(badge => badge.count > 0);
  }

  /**
   * Map notification to appropriate page
   */
  private mapNotificationToPage(notification: SmartNotification): Page | null {
    if (notification.relatedPage) {
      return notification.relatedPage;
    }

    // Map by category
    switch (notification.category) {
      case 'deadline':
      case 'matter':
      case 'court_date':
      case 'client':
        return 'matters';
      case 'invoice':
        return 'finance';
      case 'system':
        return 'settings';
      default:
        return 'dashboard';
    }
  }

  /**
   * Calculate notification metrics
   */
  private calculateMetrics(): NotificationMetrics {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;
    const urgent = this.notifications.filter(n => n.type === 'urgent' && !n.read).length;

    const byCategory: Record<SmartNotification['category'], number> = {
      deadline: 0,
      invoice: 0,
      matter: 0,
      court_date: 0,
      client: 0,
      system: 0
    };

    const byPage: Record<Page, number> = {
      dashboard: 0,
      matters: 0,
      finance: 0,
      'practice-growth': 0,
      'ai-analytics': 0,
      academy: 0,
      settings: 0,
      reports: 0,
      compliance: 0
    };

    this.notifications.filter(n => !n.read).forEach(notification => {
      byCategory[notification.category]++;
      
      const page = this.mapNotificationToPage(notification);
      if (page) {
        byPage[page]++;
      }
    });

    return {
      total,
      unread,
      urgent,
      byCategory,
      byPage
    };
  }

  /**
   * Initialize with mock notifications
   */
  private initializeNotifications(): void {
    const now = new Date();
    
    this.notifications = [
      {
        id: 'notif_1',
        type: 'urgent',
        category: 'deadline',
        title: 'Filing Deadline Approaching',
        message: 'Constitutional Court application due in 2 hours',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        read: false,
        actionable: true,
        actions: [
          {
            id: 'view_matter',
            label: 'View Matter',
            action: 'navigate',
            target: '/matters'
          },
          {
            id: 'snooze',
            label: 'Snooze 30min',
            action: 'snooze',
            parameters: { minutes: 30 }
          }
        ],
        relatedPage: 'matters',
        priority: 10
      },
      {
        id: 'notif_2',
        type: 'urgent',
        category: 'invoice',
        title: 'Overdue Payment',
        message: 'Van der Merwe Trust invoice overdue by 15 days (R45,000)',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        read: false,
        actionable: true,
        actions: [
          {
            id: 'view_invoice',
            label: 'View Invoice',
            action: 'navigate',
            target: '/finance'
          },
          {
            id: 'send_reminder',
            label: 'Send Reminder',
            action: 'api_call',
            target: '/api/invoices/send-reminder'
          }
        ],
        relatedPage: 'finance',
        priority: 9
      },
      {
        id: 'notif_3',
        type: 'attention',
        category: 'court_date',
        title: 'Court Appearance Tomorrow',
        message: 'Johannesburg High Court at 9:00 AM',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        read: false,
        actionable: true,
        actions: [
          {
            id: 'view_matter',
            label: 'View Matter',
            action: 'navigate',
            target: '/matters'
          }
        ],
        relatedPage: 'matters',
        priority: 8
      },
      {
        id: 'notif_4',
        type: 'info',
        category: 'matter',
        title: 'New Matter Assigned',
        message: 'Corporate merger case requires urgent review',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000),
        read: false,
        actionable: true,
        actions: [
          {
            id: 'view_matter',
            label: 'View Matter',
            action: 'navigate',
            target: '/matters'
          }
        ],
        relatedPage: 'matters',
        priority: 6
      },
      {
        id: 'notif_5',
        type: 'success',
        category: 'invoice',
        title: 'Payment Received',
        message: 'XYZ Ltd paid R25,000 invoice',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000),
        read: false,
        actionable: false,
        relatedPage: 'finance',
        priority: 3
      }
    ];
  }

  /**
   * Auto-refresh notifications
   */
  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      // In production, this would fetch from API
      this.generateNewNotifications();
      this.cleanupExpiredNotifications();
      this.notifySubscribers();
    }, 30000); // 30 seconds
  }

  /**
   * Generate new notifications (mock)
   */
  private generateNewNotifications(): void {
    // Randomly generate new notifications for demo
    if (Math.random() < 0.1) { // 10% chance every 30 seconds
      const types: SmartNotification['type'][] = ['info', 'attention', 'urgent'];
      const categories: SmartNotification['category'][] = ['matter', 'client', 'invoice', 'deadline'];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      this.addNotification({
        type,
        category,
        title: `New ${category} notification`,
        message: `This is a ${type} notification about ${category}`,
        actionable: false,
        priority: type === 'urgent' ? 8 : type === 'attention' ? 5 : 3
      });
    }
  }

  /**
   * Clean up expired notifications
   */
  private cleanupExpiredNotifications(): void {
    const now = new Date();
    const initialLength = this.notifications.length;
    
    this.notifications = this.notifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );

    // Also remove old read notifications (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => 
      !n.read || n.timestamp > sevenDaysAgo
    );

    if (this.notifications.length !== initialLength) {
      this.notifySubscribers();
    }
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.notifications);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });

    this.badgeSubscribers.forEach(callback => {
      try {
        callback(this.calculateBadges());
      } catch (error) {
        console.error('Error in badge subscriber:', error);
      }
    });

    this.metricsSubscribers.forEach(callback => {
      try {
        callback(this.calculateMetrics());
      } catch (error) {
        console.error('Error in metrics subscriber:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.subscribers = [];
    this.badgeSubscribers = [];
    this.metricsSubscribers = [];
  }
}

// Export singleton instance
export const smartNotificationsService = new SmartNotificationsService();
export default smartNotificationsService;