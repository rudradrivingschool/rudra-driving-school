// Supabase response typed as any — PostgREST does not infer from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export interface Payment {
  id: string;
  admission_id: string;
  amount: number;
  payment_type:
    | "advance"
    | "installment_1"
    | "installment_2"
    | "installment_3"
    | "other";
  payment_date: string;
  notes?: string;
}

export const usePayments = () => {
  const queryClient = useQueryClient();

  const fetchPayments = async () => {
    const data = await apiClient.getPayments();

    const formattedPayments: Payment[] = ((data as any[]) || []).map(
      (payment: any) => ({
        id: payment.id,
        admission_id: payment.admission_id,
        amount: payment.amount,
        payment_type: payment.payment_type as Payment["payment_type"],
        payment_date: payment.payment_date,
        notes: payment.notes || undefined,
      })
    );

    return formattedPayments;
  };

  const {
    data: payments = [],
    isLoading: loading,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: Omit<Payment, "id">) => {
      await apiClient.createPayment({
        admission_id: paymentData.admission_id,
        amount: paymentData.amount,
        payment_type: paymentData.payment_type,
        payment_date: paymentData.payment_date,
        notes: paymentData.notes,
      });
    },
    onSuccess: () => {
      toast.success("Payment added successfully!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => {
      toast.error("Failed to add payment");
    },
  });

  const addPayment = async (
    paymentData: Omit<Payment, "id">
  ): Promise<boolean> => {
    try {
      await addPaymentMutation.mutateAsync(paymentData);
      return true;
    } catch {
      return false;
    }
  };

  const updatePaymentMutation = useMutation({
    mutationFn: async ({
      id,
      paymentData,
    }: {
      id: string;
      paymentData: Partial<Omit<Payment, "id">>;
    }) => {
      await apiClient.updatePayment(id, {
        admission_id: paymentData.admission_id,
        amount: paymentData.amount,
        payment_type: paymentData.payment_type,
        payment_date: paymentData.payment_date,
        notes: paymentData.notes,
      });
    },
    onSuccess: () => {
      toast.success("Payment updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => {
      toast.error("Failed to update payment");
    },
  });

  const updatePayment = async (
    id: string,
    paymentData: Partial<Omit<Payment, "id">>
  ): Promise<boolean> => {
    try {
      await updatePaymentMutation.mutateAsync({ id, paymentData });
      return true;
    } catch {
      return false;
    }
  };

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deletePayment(id);
    },
    onSuccess: () => {
      toast.success("Payment deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => {
      toast.error("Failed to delete payment");
    },
  });

  const deletePayment = async (id: string): Promise<boolean> => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  // Derived functions - operate from cached payments data only, no network requests
  const getPaymentsByAdmission = (admissionId: string) => {
    return payments.filter((payment) => payment.admission_id === admissionId);
  };

  const getTotalCollected = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  // Preserve refetch API - calls queryRefetch which triggers immediate network request
  const refetch = async () => {
    await queryRefetch();
  };

  return {
    payments,
    loading,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentsByAdmission,
    getTotalCollected,
    refetch,
  };
};