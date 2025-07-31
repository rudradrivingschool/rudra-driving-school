import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  admission_id: string;
  amount: number;
  payment_type: 'advance' | 'installment_1' | 'installment_2' | 'installment_3' | 'other';
  payment_date: string;
  notes?: string;
}

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments' as any)
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast.error('Failed to load payments');
        return;
      }

      const formattedPayments: Payment[] = (data as any[] || []).map((payment: any) => ({
        id: payment.id,
        admission_id: payment.admission_id,
        amount: payment.amount,
        payment_type: payment.payment_type as Payment['payment_type'],
        payment_date: payment.payment_date,
        notes: payment.notes || undefined
      }));
      setPayments(formattedPayments);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('payments' as any)
        .insert({
          admission_id: paymentData.admission_id,
          amount: paymentData.amount,
          payment_type: paymentData.payment_type,
          payment_date: paymentData.payment_date,
          notes: paymentData.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding payment:', error);
        toast.error('Failed to add payment');
        return false;
      }

      toast.success('Payment added successfully!');
      await fetchPayments();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add payment');
      return false;
    }
  };

  const updatePayment = async (id: string, paymentData: Partial<Omit<Payment, 'id'>>) => {
    try {
      const { error } = await supabase
        .from('payments' as any)
        .update({
          admission_id: paymentData.admission_id,
          amount: paymentData.amount,
          payment_type: paymentData.payment_type,
          payment_date: paymentData.payment_date,
          notes: paymentData.notes
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating payment:', error);
        toast.error('Failed to update payment');
        return false;
      }

      toast.success('Payment updated successfully!');
      await fetchPayments();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update payment');
      return false;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        toast.error('Failed to delete payment');
        return false;
      }

      toast.success('Payment deleted successfully!');
      await fetchPayments();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete payment');
      return false;
    }
  };

  const getPaymentsByAdmission = (admissionId: string) => {
    return payments.filter(payment => payment.admission_id === admissionId);
  };

  const getTotalCollected = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    loading,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentsByAdmission,
    getTotalCollected,
    refetch: fetchPayments
  };
};