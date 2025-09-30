import type { TickerItem } from '../components/navigation/RealTimeTicker';
import { 
  Clock, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  DollarSign,
  Users,
  Gavel,
  TrendingUp,
  Bell,
  CheckCircle
} from 'lucide-react';

export interface TickerDataFilters {
  urgency?: ('urgent' | 'attention' | 'normal')[];
  types?: ('deadline' | 'invoice' | 'matter' | 'court_date' | 'client' | 'payment')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TickerMetrics {
  totalItems: number;
  urgentItems: number;
  overdueInvoices: number;
  upcomingDeadlines: number;
  courtDates: number;
  newMatters: number;
}

class TickerDataService {
  private refreshInterval: number = 30000; // 30 seconds
  private subscribers: ((items: TickerItem[]) => void)[] = [];
  private metricsSubscribers: ((metrics: TickerMetrics) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoRefresh();
  }

  /**
   * Subscribe to ticker data updates
   */
  subscribe(callback: (items: TickerItem[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately send current data
    this.getTickerItems().then(callback);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Subscribe to ticker metrics updates
   */
  subscribeToMetrics(callback: (metrics: TickerMetrics) => void): () => void {
    this.metricsSubscribers.push(callback);
    
    // Immediately send current metrics
    this.getTickerMetrics().then(callback);
    
    return () => {
      this.metricsSubscribers = this.metricsSubscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Get current ticker items with optional filtering
   */
  async getTickerItems(filters?: TickerDataFilters): Promise<TickerItem[]> {
    try {
      // In production, this would be an API call
      const items = await this.generateMockTickerData();
      
      if (!filters) {
        return items;
      }

      return items.filter(item => {
        // Filter by urgency
        if (filters.urgency && !filters.urgency.includes(item.urgency)) {
          return false;
        }

        // Filter by type
        if (filters.types && !filters.types.includes(item.type)) {
          return false;
        }

        // Filter by date range
        if (filters.dateRange && item.dueDate) {
          const itemDate = item.dueDate;
          if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Failed to fetch ticker items:', error);
      return [];
    }
  }

  /**
   * Get ticker metrics summary
   */
  async getTickerMetrics(): Promise<TickerMetrics> {
    try {
      const items = await this.getTickerItems();
      
      return {
        totalItems: items.length,
        urgentItems: items.filter(item => item.urgency === 'urgent').length,
        overdueInvoices: items.filter(item => item.type === 'invoice' && item.urgency === 'urgent').length,
        upcomingDeadlines: items.filter(item => item.type === 'deadline').length,
        courtDates: items.filter(item => item.type === 'court_date').length,
        newMatters: items.filter(item => item.type === 'matter').length
      };
    } catch (error) {
      console.error('Failed to fetch ticker metrics:', error);
      return {
        totalItems: 0,
        urgentItems: 0,
        overdueInvoices: 0,
        upcomingDeadlines: 0,
        courtDates: 0,
        newMatters: 0
      };
    }
  }

  /**
   * Mark ticker item as acknowledged/handled
   */
  async acknowledgeItem(itemId: string): Promise<boolean> {
    try {
      // In production, this would update the backend
      console.log(`Acknowledging ticker item: ${itemId}`);
      
      // Trigger refresh for subscribers
      this.notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Failed to acknowledge ticker item:', error);
      return false;
    }
  }

  /**
   * Refresh ticker data manually
   */
  async refresh(): Promise<void> {
    this.notifySubscribers();
  }

  /**
   * Start auto-refresh
   */
  private startAutoRefresh(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.notifySubscribers();
    }, this.refreshInterval);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Set refresh interval
   */
  setRefreshInterval(interval: number): void {
    this.refreshInterval = interval;
    this.startAutoRefresh();
  }

  /**
   * Notify all subscribers of data updates
   */
  private async notifySubscribers(): Promise<void> {
    try {
      const [items, metrics] = await Promise.all([
        this.getTickerItems(),
        this.getTickerMetrics()
      ]);

      this.subscribers.forEach(callback => {
        try {
          callback(items);
        } catch (error) {
          console.error('Error in ticker subscriber callback:', error);
        }
      });

      this.metricsSubscribers.forEach(callback => {
        try {
          callback(metrics);
        } catch (error) {
          console.error('Error in metrics subscriber callback:', error);
        }
      });
    } catch (error) {
      console.error('Failed to notify ticker subscribers:', error);
    }
  }

  /**
   * Generate mock ticker data for development/testing
   */
  private async generateMockTickerData(): Promise<TickerItem[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Simulate some randomness in the data
    const randomItems: TickerItem[] = [
      {
        id: 'deadline-1',
        type: 'deadline',
        title: 'Constitutional Court Filing Due',
        description: 'Smith v Jones - Application deadline in 2 hours',
        urgency: 'urgent',
        dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        navigateTo: '/matters',
        icon: React.createElement(Gavel, { className: 'w-4 h-4' })
      },
      {
        id: 'invoice-1',
        type: 'invoice',
        title: 'Overdue Invoice',
        description: 'Van der Merwe Trust - R45,000 overdue 15 days',
        urgency: 'urgent',
        amount: 45000,
        dueDate: yesterday,
        navigateTo: '/finance',
        icon: React.createElement(DollarSign, { className: 'w-4 h-4' })
      },
      {
        id: 'court-1',
        type: 'court_date',
        title: 'High Court Appearance',
        description: 'Johannesburg High Court - Tomorrow 9:00 AM',
        urgency: 'attention',
        dueDate: tomorrow,
        navigateTo: '/matters',
        icon: React.createElement(Calendar, { className: 'w-4 h-4' })
      },
      {
        id: 'matter-1',
        type: 'matter',
        title: 'New Matter Assigned',
        description: 'Corporate Merger - Urgent review required',
        urgency: 'attention',
        navigateTo: '/matters',
        icon: React.createElement(FileText, { className: 'w-4 h-4' })
      },
      {
        id: 'client-1',
        type: 'client',
        title: 'Client Meeting Reminder',
        description: 'ABC Corporation - Strategy session in 1 hour',
        urgency: 'normal',
        dueDate: new Date(now.getTime() + 60 * 60 * 1000),
        navigateTo: '/matters',
        icon: React.createElement(Users, { className: 'w-4 h-4' })
      },
      {
        id: 'payment-1',
        type: 'payment',
        title: 'Payment Received',
        description: 'XYZ Ltd - R25,000 payment processed',
        urgency: 'normal',
        amount: 25000,
        navigateTo: '/finance',
        icon: React.createElement(CheckCircle, { className: 'w-4 h-4' })
      },
      {
        id: 'deadline-2',
        type: 'deadline',
        title: 'Discovery Deadline',
        description: 'Commercial Litigation - Document production due next week',
        urgency: 'normal',
        dueDate: nextWeek,
        navigateTo: '/matters',
        icon: React.createElement(Clock, { className: 'w-4 h-4' })
      },
      {
        id: 'invoice-2',
        type: 'invoice',
        title: 'Invoice Due Soon',
        description: 'Property Development Co - R12,500 due in 3 days',
        urgency: 'attention',
        amount: 12500,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        navigateTo: '/finance',
        icon: React.createElement(DollarSign, { className: 'w-4 h-4' })
      },
      {
        id: 'court-2',
        type: 'court_date',
        title: 'Labour Court Hearing',
        description: 'CCMA Arbitration - Next Monday 10:00 AM',
        urgency: 'normal',
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        navigateTo: '/matters',
        icon: React.createElement(Gavel, { className: 'w-4 h-4' })
      },
      {
        id: 'matter-2',
        type: 'matter',
        title: 'Contract Review',
        description: 'Mining Rights Agreement - Final review pending',
        urgency: 'attention',
        navigateTo: '/matters',
        icon: React.createElement(FileText, { className: 'w-4 h-4' })
      }
    ];

    // Sort by urgency and due date
    return randomItems.sort((a, b) => {
      const urgencyOrder = { urgent: 0, attention: 1, normal: 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }

      // If same urgency, sort by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      return 0;
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.subscribers = [];
    this.metricsSubscribers = [];
  }
}

// Export singleton instance
export const tickerDataService = new TickerDataService();
export default tickerDataService;