import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateAdmissionRideProgress } from './useAdmissionRideProgress';

// Ride type for this hook
export interface Ride {
  id: string;
  clientName: string;
  driverName: string;
  driverId?: string;
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
  onProgressUpdate,
}: {
  drivers: Driver[];
  onProgressUpdate?: () => void;
}) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [clientNameToId, setClientNameToId] = useState<Record<string, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);

  // Fetch clients and build name-to-id map
  const fetchClientsMap = useCallback(async () => {
    const { data, error } = await supabase
      .from('admissions')
      .select('id, student_name');

    if (!error && data) {
      const map: Record<string, string> = {};
      data.forEach((row: any) => {
        map[row.student_name] = row.id;
      });
      setClientNameToId(map);
    }
  }, []);

  // Fetch all rides from the database
  const fetchRides = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch rides');
      setRides([]);
    } else {
      setRides(
        (data || []).map((row: any) => ({
          id: row.id,
          clientName: row.client_name,
          driverName:
            row.driver_id && drivers.length > 0
              ? drivers.find((d) => d.id === row.driver_id)?.name || 'Unknown'
              : 'Unknown',
          driverId: row.driver_id,
          car: row.car || '',
          date: row.date ? new Date(row.date) : new Date(),
          time: row.time || '',
          status: 'completed',
          notes: row.notes || '',
        }))
      );
    }
    setIsLoading(false);
  }, [drivers]);

  // Add a new ride (always status "completed")
  const addRide = useCallback(
    async ({
      clientName,
      driverName,
      car,
      notes,
    }: {
      clientName: string;
      driverName: string;
      car: string;
      notes?: string;
    }) => {
      const client_id = clientNameToId[clientName] || null;
      const driver = drivers.find((d) => d.name === driverName);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setIsLoading(true);
      const { error } = await supabase.from('rides').insert({
        client_id,
        client_name: clientName,
        driver_id: driver?.id,
        car,
        notes,
        date: todayStr,
        time: timeStr,
        status: 'completed',
      });
      setIsLoading(false);

      if (error) {
        toast.error('Failed to add ride');
        return false;
      } else {
        toast.success('Ride added successfully!');
        // Update progress for this client every insert, may complete them
        if (client_id) {
          await updateAdmissionRideProgress(client_id, onProgressUpdate);
        }
        setTimeout(() => {
          fetchRides();
        }, 600);
        return true;
      }
    },
    [clientNameToId, drivers, fetchRides, onProgressUpdate]
  );

  // Update an existing ride
  const updateRide = useCallback(
    async (
      rideId: string,
      rideData: {
        clientName: string;
        driverName: string;
        car: string;
        notes?: string;
      }
    ) => {
      try {
        const client_id = clientNameToId[rideData.clientName] || null;
        const driver = drivers.find((d) => d.name === rideData.driverName);

        setIsLoading(true);
        const { error } = await supabase
          .from('rides')
          .update({
            client_id,
            client_name: rideData.clientName,
            driver_id: driver?.id,
            car: rideData.car,
            notes: rideData.notes,
          })
          .eq('id', rideId);

        if (error) {
          console.error('Error updating ride:', error);
          toast.error('Failed to update ride');
          return false;
        }

        toast.success('Ride updated successfully!');

        // Update progress for both old and new clients if they differ
        const oldRide = rides.find((r) => r.id === rideId);
        if (oldRide && oldRide.clientName !== rideData.clientName) {
          // Update progress for old client
          const oldClientId = clientNameToId[oldRide.clientName];
          if (oldClientId) {
            await updateAdmissionRideProgress(oldClientId, onProgressUpdate);
          }
        }

        // Update progress for new client
        if (client_id) {
          await updateAdmissionRideProgress(client_id, onProgressUpdate);
        }

        await fetchRides();
        return true;
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to update ride');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [clientNameToId, drivers, fetchRides, onProgressUpdate, rides]
  );

  // Delete a ride
  const deleteRide = useCallback(
    async (rideId: string) => {
      try {
        const rideToDelete = rides.find((r) => r.id === rideId);

        setIsLoading(true);
        const { error } = await supabase
          .from('rides')
          .delete()
          .eq('id', rideId);

        if (error) {
          console.error('Error deleting ride:', error);
          toast.error('Failed to delete ride');
          return false;
        }

        toast.success('Ride deleted successfully!');

        // Update progress for the client after deletion
        if (rideToDelete) {
          const client_id = clientNameToId[rideToDelete.clientName];
          if (client_id) {
            await updateAdmissionRideProgress(client_id, onProgressUpdate);
          }
        }

        await fetchRides();
        return true;
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to delete ride');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRides, onProgressUpdate, clientNameToId, rides]
  );

  // Effect: fetch client map and rides on mount, and when drivers change
  useEffect(() => {
    fetchClientsMap();
  }, [fetchClientsMap]);
  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Effect: Check and update admission progress for every ride or client map change (may mark client as Completed)
  useEffect(() => {
    const checkAndUpdateAllProgress = async () => {
      for (const ride of rides) {
        if (ride.clientName in clientNameToId) {
          const clientId = clientNameToId[ride.clientName];
          await updateAdmissionRideProgress(clientId, onProgressUpdate);
        }
      }
    };
    if (rides.length && Object.keys(clientNameToId).length) {
      checkAndUpdateAllProgress();
    }
  }, [rides, clientNameToId, onProgressUpdate]);

  return {
    rides,
    isLoading,
    addRide,
    updateRide,
    deleteRide,
    fetchRides,
    clientNameToId,
    completeRide: async () => true, // not used
  };
};
