// Supabase response typed as any — PostgREST does not infer from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Driver } from "@/types/driver";

export const useDrivers = () => {
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading: loading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const data = await apiClient.getDrivers();

      const formattedDrivers: Driver[] = data.map((driver: any) => ({
        id: driver.id,
        name: driver.name,
        phone: driver.phone || "",
        email: driver.email,
        licenseNumber: driver.license_number || "",
        joinDate: driver.join_date || "",
        status: (driver.status as "active" | "inactive") || "active",
        totalRides: driver.total_rides || 0,
        rides: [],
        username: driver.username,
        password: driver.password,
        role: (driver.role as "admin" | "driver") || "driver",
      }));

      return formattedDrivers;
    },
  });

  const addDriverMutation = useMutation({
    mutationFn: (driverData: Driver) => {
      return apiClient.createDriver({
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        license_number: driverData.licenseNumber,
        join_date: driverData.joinDate,
        status: driverData.status,
        total_rides: driverData.totalRides,
        username: driverData.username,
        password: driverData.password,
        role: driverData.role,
      });
    },
    onSuccess: () => {
      toast.success("Driver added successfully!");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: () => {
      toast.error("Failed to add driver");
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ driverId, driverData }: { driverId: string; driverData: Driver }) => {
      return apiClient.updateDriver(driverId, {
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        license_number: driverData.licenseNumber,
        join_date: driverData.joinDate,
        status: driverData.status,
        total_rides: driverData.totalRides,
        username: driverData.username,
        password: driverData.password,
        role: driverData.role,
      });
    },
    onSuccess: () => {
      toast.success("Driver updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: () => {
      toast.error("Failed to update driver");
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (driverId: string) => {
      return apiClient.deleteDriver(driverId);
    },
    onSuccess: () => {
      toast.success("Driver deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: () => {
      toast.error("Failed to delete driver");
    },
  });

  const addDriver = async (driverData: Driver) => {
    try {
      await addDriverMutation.mutateAsync(driverData);
      return true;
    } catch {
      return false;
    }
  };

  const updateDriver = async (driverId: string, driverData: Driver) => {
    try {
      await updateDriverMutation.mutateAsync({ driverId, driverData });
      return true;
    } catch {
      return false;
    }
  };

  const deleteDriver = async (driverId: string) => {
    try {
      await deleteDriverMutation.mutateAsync(driverId);
      return true;
    } catch {
      return false;
    }
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
  };

  return {
    drivers,
    loading,
    addDriver,
    updateDriver,
    deleteDriver,
    refetch,
  };
};