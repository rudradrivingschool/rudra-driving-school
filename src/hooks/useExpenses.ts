
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  purpose: string;
  amount: number;
  date: string;
  driverId?: string;
  driverName?: string;
  notes?: string;
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          driver:drivers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
        return;
      }

      const formattedExpenses: Expense[] = data.map(expense => ({
        id: expense.id,
        purpose: expense.purpose,
        amount: expense.amount,
        date: expense.date || '',
        driverId: expense.driver_id || undefined,
        driverName: expense.driver?.name || '',
        notes: expense.notes || ''
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          purpose: expenseData.purpose,
          amount: expenseData.amount,
          date: expenseData.date,
          driver_id: expenseData.driverId,
          notes: expenseData.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        toast.error('Failed to add expense');
        return false;
      }

      toast.success('Expense added successfully!');
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add expense');
      return false;
    }
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          purpose: expenseData.purpose,
          amount: expenseData.amount,
          date: expenseData.date,
          driver_id: expenseData.driverId,
          notes: expenseData.notes
        })
        .eq('id', expenseId);

      if (error) {
        console.error('Error updating expense:', error);
        toast.error('Failed to update expense');
        return false;
      }

      toast.success('Expense updated successfully!');
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update expense');
      return false;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
        return false;
      }

      toast.success('Expense deleted successfully!');
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete expense');
      return false;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
};
