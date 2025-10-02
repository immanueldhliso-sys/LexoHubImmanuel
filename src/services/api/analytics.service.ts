import { supabase } from '@/lib/supabase';

export interface CollectionMetrics {
  collectionRate30d: number;
  collectionRate60d: number;
  collectionRate90d: number;
  averageCollectionDays: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueAmount: number;
  collectionTrend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceMetrics {
  settlementRate: number;
  billingEfficiency: number;
  clientSatisfaction: number;
  matterResolution: number;
  timeManagement: number;
  wipUtilization: number;
}

export interface CashFlowAnalysis {
  monthlyData: Array<{
    month: string;
    year: number;
    inflow: number;
    outflow: number;
    net: number;
  }>;
  projectedNextMonth: number;
  averageMonthlyInflow: number;
  cashFlowTrend: 'positive' | 'neutral' | 'negative';
}

export class AnalyticsService {
  static async getCollectionMetrics(): Promise<CollectionMetrics> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const invoices30d = invoices?.filter(inv => new Date(inv.created_at) >= thirtyDaysAgo) || [];
      const invoices60d = invoices?.filter(inv => new Date(inv.created_at) >= sixtyDaysAgo) || [];
      const invoices90d = invoices?.filter(inv => new Date(inv.created_at) >= ninetyDaysAgo) || [];

      const calculateCollectionRate = (invs: any[]) => {
        if (invs.length === 0) return 0;
        const totalBilled = invs.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalCollected = invs.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
        return totalBilled > 0 ? (totalCollected / totalBilled) : 0;
      };

      const paidInvoices = invoices?.filter(inv => inv.status === 'paid' && inv.datePaid) || [];
      const averageCollectionDays = paidInvoices.length > 0
        ? paidInvoices.reduce((sum, inv) => {
            const invoiceDate = new Date(inv.dateIssued);
            const paidDate = new Date(inv.datePaid!);
            const days = Math.floor((paidDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + Math.max(0, days);
          }, 0) / paidInvoices.length
        : 0;

      const totalCollected = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
      const totalOutstanding = invoices?.reduce((sum, inv) => {
        if (inv.status !== 'paid' && inv.status !== 'written_off') {
          return sum + (inv.total_amount - (inv.amount_paid || 0));
        }
        return sum;
      }, 0) || 0;

      const overdueAmount = invoices?.reduce((sum, inv) => {
        if (inv.status === 'overdue') {
          return sum + (inv.total_amount - (inv.amount_paid || 0));
        }
        return sum;
      }, 0) || 0;

      const rate30d = calculateCollectionRate(invoices30d);
      const rate60d = calculateCollectionRate(invoices60d);
      const collectionTrend = rate30d > rate60d ? 'improving' : rate30d < rate60d ? 'declining' : 'stable';

      return {
        collectionRate30d: rate30d,
        collectionRate60d: rate60d,
        collectionRate90d: calculateCollectionRate(invoices90d),
        averageCollectionDays,
        totalCollected,
        totalOutstanding,
        overdueAmount,
        collectionTrend
      };
    } catch (error) {
      console.error('Error fetching collection metrics:', error);
      throw new Error('Failed to fetch collection metrics');
    }
  }

  static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const [invoicesResult, mattersResult] = await Promise.all([
        supabase.from('invoices').select('*'),
        supabase.from('matters').select('*')
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (mattersResult.error) throw mattersResult.error;

      const invoices = invoicesResult.data || [];
      const matters = mattersResult.data || [];

      const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.datePaid);
      const onTimePayments = paidInvoices.filter(inv => {
        const paidDate = new Date(inv.datePaid!);
        const dueDate = new Date(inv.dateDue);
        return paidDate <= dueDate;
      });
      const clientSatisfaction = paidInvoices.length > 0
        ? (onTimePayments.length / paidInvoices.length) * 100
        : 0;

      const settledMatters = matters.filter(m => m.status === 'settled' || m.status === 'completed');
      const settlementRate = matters.length > 0
        ? (settledMatters.length / matters.length) * 100
        : 0;

      const totalWip = matters.reduce((sum, m) => sum + (m.wip_value || 0), 0);
      const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const billingEfficiency = totalWip > 0
        ? Math.min((totalBilled / totalWip) * 100, 100)
        : 0;

      const activeMatters = matters.filter(m => m.status === 'active');
      const mattersWithRecentActivity = activeMatters.filter(m => {
        const updated = new Date(m.updated_at);
        const daysSinceUpdate = Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceUpdate <= 14;
      });
      const timeManagement = activeMatters.length > 0
        ? (mattersWithRecentActivity.length / activeMatters.length) * 100
        : 0;

      const matterResolution = matters.length > 0
        ? (settledMatters.length / matters.length) * 100
        : 0;

      const wipUtilization = totalWip > 0
        ? (totalBilled / totalWip) * 100
        : 0;

      return {
        settlementRate,
        billingEfficiency: Math.min(billingEfficiency, 100),
        clientSatisfaction,
        matterResolution,
        timeManagement,
        wipUtilization: Math.min(wipUtilization, 100)
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }

  static async getCashFlowAnalysis(monthsBack: number = 6): Promise<CashFlowAnalysis> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      
      const monthlyData = Array.from({ length: monthsBack }, (_, i) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (monthsBack - 1 - i));
        const month = date.getMonth();
        const year = date.getFullYear();

        const monthInvoices = invoices?.filter(inv => {
          const paidDate = inv.datePaid ? new Date(inv.datePaid) : null;
          return paidDate && paidDate.getMonth() === month && paidDate.getFullYear() === year;
        }) || [];

        const inflow = monthInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
        const outflow = 0;

        return {
          month: monthNames[month],
          year,
          inflow,
          outflow,
          net: inflow - outflow
        };
      });

      const averageMonthlyInflow = monthlyData.reduce((sum, m) => sum + m.inflow, 0) / monthsBack;
      
      const recentMonths = monthlyData.slice(-3);
      const olderMonths = monthlyData.slice(0, 3);
      const recentAvg = recentMonths.reduce((sum, m) => sum + m.inflow, 0) / recentMonths.length;
      const olderAvg = olderMonths.reduce((sum, m) => sum + m.inflow, 0) / olderMonths.length;
      
      const cashFlowTrend = recentAvg > olderAvg * 1.1 ? 'positive' : 
                           recentAvg < olderAvg * 0.9 ? 'negative' : 'neutral';

      return {
        monthlyData,
        projectedNextMonth: averageMonthlyInflow,
        averageMonthlyInflow,
        cashFlowTrend
      };
    } catch (error) {
      console.error('Error fetching cash flow analysis:', error);
      throw new Error('Failed to fetch cash flow analysis');
    }
  }
}
