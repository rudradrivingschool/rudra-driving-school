// Supabase response typed as any — PostgREST does not infer from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading: loading, refetch: queryRefetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const data = await apiClient.getExpenses();

      // Read cached drivers to map driver IDs to names
      const drivers = queryClient.getQueryData<Expense[]>(["drivers"]);
      const driverMap = new Map<string, string>();
      if (drivers && Array.isArray(drivers)) {
        drivers.forEach((driver: any) => {
          if (driver.id) {
            driverMap.set(driver.id, driver.name || "");
          }
        });
      }

      const formattedExpenses: Expense[] = data.map((expense: any) => ({
        id: expense.id,
        purpose: expense.purpose,
        amount: expense.amount,
        date: expense.date || "",
        driverId: expense.driver_id || undefined,
        driverName: expense.driver_id
          ? driverMap.get(expense.driver_id) || ""
          : "",
        notes: expense.notes || "",
      }));

      return formattedExpenses;
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: Omit<Expense, "id">) => {
      return apiClient.createExpense({
        purpose: expenseData.purpose,
        amount: expenseData.amount,
        date: expenseData.date,
        driver_id: expenseData.driverId,
        notes: expenseData.notes,
      });
    },
    onSuccess: () => {
      toast.success("Expense added successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast.error("Failed to add expense");
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      return apiClient.updateExpense(id, {
        purpose: data.purpose,
        amount: data.amount,
        date: data.date,
        driver_id: data.driverId,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast.success("Expense updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast.error("Failed to update expense");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.deleteExpense(id);
    },
    onSuccess: () => {
      toast.success("Expense deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
  });

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    try {
      await addExpenseMutation.mutateAsync(expenseData);
      return true;
    } catch {
      return false;
    }
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    try {
      await updateExpenseMutation.mutateAsync({ id: expenseId, data: expenseData });
      return true;
    } catch {
      return false;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await deleteExpenseMutation.mutateAsync(expenseId);
      return true;
    } catch {
      return false;
    }
  };

  const refetch = async () => {
    await queryRefetch();
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
};
