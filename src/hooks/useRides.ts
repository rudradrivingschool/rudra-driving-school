// Supabase response typed as any — PostgREST does not infer from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { updateAdmissionRideProgress } from './useAdmissionRideProgress';
import { format as formatDate } from 'date-fns';
import { Client } from '@/types/client';

// Ride type for this hook
export interface Ride {
  id: string;
  clientName: string;
  driverName: string;
  driverId?: string;
  client_id?: string;
  car: string;
  date: Date;
  time: string;
  status: 'completed';
  notes?: string;
}

export interface RideClient {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Driver {
  id: string;
  name: string;
}

export interface Car {
  id: string;
  name: string;
}

export const useRides = ({
  drivers,
  clients = [],
  onProgressUpdate,
}: {
  drivers: Driver[];
  clients?: Client[];
  onProgressUpdate?: () => void;
}) => {
  const queryClient = useQueryClient();

  // Derive clientNameToId from the clients passed in by the caller.
  // Callers (RideManager, AnalyticsDashboard, DashboardOverview) all call useAdmissions(),
  // so this data is already available without any additional network request.
  const clientNameToId: Record<string, string> = {};
  clients.forEach((client) => {
    if (client.name) {
      clientNameToId[client.name] = client.id;
    }
  });

  // Fetch all rides from the database
  const fetchRides = async () => {
    try {
      const response = await apiClient.getRides();
      // The unfiltered endpoint returns { rides: Row[], totalCount: number }.
      // totalCount is the exact Supabase count, unaffected by the PostgREST
      // row cap (default 1 000), so it is safe to use for "Total Rides" stats.
      const rows = response.rides || [];
      const totalRideCount: number = response.totalCount ?? rows.length;
      const mappedRides: Ride[] = rows.map((row: any) => ({
        id: row.id,
        clientName: row.client_name,
        driverName:
          row.driver_id && drivers.length > 0
            ? drivers.find((d) => d.id === row.driver_id)?.name || 'Unknown'
            : 'Unknown',
        driverId: row.driver_id,
        client_id: row.client_id,
        car: row.car || '',
        date: row.date ? new Date(`${row.date}T00:00:00`) : new Date(),
        time: row.time || '',
        status: 'completed',
        notes: row.notes || '',
      }));
      return { rides: mappedRides, totalRideCount };
    } catch (error) {
      toast.error('Failed to fetch rides');
      return { rides: [], totalRideCount: 0 };
    }
  };

  const {
    data: ridesData = { rides: [], totalRideCount: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['rides'],
    queryFn: fetchRides,
  });

  const rides = ridesData.rides;
  const totalRideCount = ridesData.totalRideCount;

  // Add a new ride (always status "completed")
  const addRideMutation = useMutation({
    mutationFn: async ({
      clientName,
      driverName,
      car,
      notes,
      customDate,
      customTime,
    }: {
      clientName: string;
      driverName: string;
      car: string;
      notes?: string;
      customDate?: Date;
      customTime?: string;
    }) => {
      const client_id = clientNameToId[clientName] || null;
      const driver = drivers.find((d) => d.name === driverName);

      // Use custom date/time if provided, otherwise use current
      const dateToUse = customDate || new Date();
      const timeToUse =
        customTime ||
        dateToUse.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      const dateStr = formatDate(dateToUse, 'yyyy-MM-dd');

      await apiClient.createRide({
        client_id,
        client_name: clientName,
        driver_id: driver?.id,
        car,
        notes,
        date: dateStr,
        time: timeToUse,
        status: 'completed',
      });

      return { client_id };
    },
    onSuccess: async ({ client_id }) => {
      toast.success('Ride added successfully!');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      // Update progress for this client every insert, may complete them.
      // Admissions cache is invalidated AFTER the DB write so the refetch
      // always sees the final status (including "Completed").
      if (client_id) {
        await updateAdmissionRideProgress(client_id, onProgressUpdate);
      }
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: () => {
      toast.error('Failed to add ride');
    },
  });

  const addRide = async ({
    clientName,
    driverName,
    car,
    notes,
    customDate,
    customTime,
  }: {
    clientName: string;
    driverName: string;
    car: string;
    notes?: string;
    customDate?: Date;
    customTime?: string;
  }) => {
    try {
      await addRideMutation.mutateAsync({
        clientName,
        driverName,
        car,
        notes,
        customDate,
        customTime,
      });
      return true;
    } catch {
      return false;
    }
  };

  // Update an existing ride
  const updateRideMutation = useMutation({
    mutationFn: async ({
      rideId,
      rideData,
    }: {
      rideId: string;
      rideData: {
        clientName: string;
        driverName: string;
        car: string;
        notes?: string;
        customDate?: Date;
        customTime?: string;
      };
    }) => {
      const client_id = clientNameToId[rideData.clientName] || null;
      const driver = drivers.find((d) => d.name === rideData.driverName);

      // Prepare update object
      const updateData: any = {
        client_id,
        client_name: rideData.clientName,
        driver_id: driver?.id,
        car: rideData.car,
        notes: rideData.notes,
      };

      // Include custom date/time if provided (superadmin feature)
      if (rideData.customDate) {
        updateData.date = formatDate(rideData.customDate, 'yyyy-MM-dd');
      }
      if (rideData.customTime) {
        updateData.time = rideData.customTime;
      }

      await apiClient.updateRide(rideId, updateData);

      // Determine affected clients for progress update
      const oldRide = rides.find((r) => r.id === rideId);
      const oldClientId = oldRide ? clientNameToId[oldRide.clientName] : null;
      const clientChanged =
        oldRide && oldRide.clientName !== rideData.clientName;

      return { client_id, oldClientId, clientChanged };
    },
    onSuccess: async ({ client_id, oldClientId, clientChanged }) => {
      toast.success('Ride updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      // Update progress for both old and new clients if they differ.
      // Admissions cache is invalidated AFTER all DB writes so the refetch
      // always sees the final status (including "Completed").
      if (clientChanged && oldClientId) {
        await updateAdmissionRideProgress(oldClientId, onProgressUpdate);
      }
      // Update progress for new client
      if (client_id) {
        await updateAdmissionRideProgress(client_id, onProgressUpdate);
      }
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: () => {
      toast.error('Failed to update ride');
    },
  });

  const updateRide = async (
    rideId: string,
    rideData: {
      clientName: string;
      driverName: string;
      car: string;
      notes?: string;
      customDate?: Date;
      customTime?: string;
    },
  ) => {
    try {
      await updateRideMutation.mutateAsync({ rideId, rideData });
      return true;
    } catch {
      return false;
    }
  };

  // Delete a ride
  const deleteRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const rideToDelete = rides.find((r) => r.id === rideId);
      await apiClient.deleteRide(rideId);
      return { rideToDelete };
    },
    onSuccess: async ({ rideToDelete }) => {
      toast.success('Ride deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      // Update progress for the client after deletion.
      // Admissions cache is invalidated AFTER the DB write so the refetch
      // always sees the final status (including "Completed").
      if (rideToDelete) {
        const client_id = clientNameToId[rideToDelete.clientName];
        if (client_id) {
          await updateAdmissionRideProgress(client_id, onProgressUpdate);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: () => {
      toast.error('Failed to delete ride');
    },
  });

  const deleteRide = async (rideId: string) => {
    try {
      await deleteRideMutation.mutateAsync(rideId);
      return true;
    } catch {
      return false;
    }
  };

  // Preserve fetchRides as a callable refetch wrapper
  const fetchRidesWrapper = async () => {
    await refetch();
  };

  return {
    rides,
    totalRideCount,
    isLoading,
    addRide,
    updateRide,
    deleteRide,
    fetchRides: fetchRidesWrapper,
    clientNameToId,
  };
};
