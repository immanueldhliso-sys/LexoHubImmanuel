import { supabase } from '@/lib/supabase';

export interface Expense {
  id: string;
  matter_id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  matter_id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  receipt_url?: string;
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  date?: string;
  category?: string;
  receipt_url?: string;
}

export class ExpensesService {
  static async getMatterExpenses(matterId: string): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('matter_id', matterId)
        .order('date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching matter expenses:', error);
      throw new Error('Failed to fetch expenses');
    }
  }

  static async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw new Error('Failed to fetch expense');
    }
  }

  static async createExpense(input: CreateExpenseInput): Promise<Expense> {
    try {
      if (!input.matter_id || !input.description || !input.amount || !input.date) {
        throw new Error('Missing required fields: matter_id, description, amount, date');
      }

      if (input.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          matter_id: input.matter_id,
          description: input.description,
          amount: input.amount,
          date: input.date,
          category: input.category || null,
          receipt_url: input.receipt_url || null
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw new Error('Failed to create expense');
    }
  }

  static async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    try {
      if (input.amount !== undefined && input.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (input.description !== undefined) updateData.description = input.description;
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.date !== undefined) updateData.date = input.date;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.receipt_url !== undefined) updateData.receipt_url = input.receipt_url;

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }

  static async getTotalExpensesForMatter(matterId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('matter_id', matterId);

      if (error) throw error;

      return data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating total expenses:', error);
      throw new Error('Failed to calculate total expenses');
    }
  }

  static async getExpensesByDateRange(
    matterId: string,
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('matter_id', matterId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching expenses by date range:', error);
      throw new Error('Failed to fetch expenses');
    }
  }

  static async getExpensesByCategory(matterId: string, category: string): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('matter_id', matterId)
        .eq('category', category)
        .order('date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      throw new Error('Failed to fetch expenses');
    }
  }
}
