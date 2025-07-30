
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Driver } from '@/types/driver';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching drivers:', error);
        toast.error('Failed to load drivers');
        return;
      }

      const formattedDrivers: Driver[] = data.map(driver => ({
        id: driver.id,
        name: driver.name,
        phone: driver.phone || '',
        email: driver.email,
        licenseNumber: driver.license_number || '',
        joinDate: driver.join_date || '',
        status: (driver.status as 'active' | 'inactive') || 'active',
        totalRides: driver.total_rides || 0,
        rides: [], // TODO: Fetch from rides table
        username: driver.username,
        password: driver.password,
        role: (driver.role as 'admin' | 'driver') || 'driver'
      }));

      setDrivers(formattedDrivers);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const addDriver = async (driverData: Driver) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert({
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          license_number: driverData.licenseNumber,
          join_date: driverData.joinDate,
          status: driverData.status,
          total_rides: driverData.totalRides,
          username: driverData.username,
          password: driverData.password,
          role: driverData.role
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding driver:', error);
        toast.error('Failed to add driver');
        return false;
      }

      toast.success('Driver added successfully!');
      await fetchDrivers();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add driver');
      return false;
    }
  };

  const updateDriver = async (driverId: string, driverData: Driver) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          license_number: driverData.licenseNumber,
          join_date: driverData.joinDate,
          status: driverData.status,
          total_rides: driverData.totalRides,
          username: driverData.username,
          password: driverData.password,
          role: driverData.role
        })
        .eq('id', driverId);

      if (error) {
        console.error('Error updating driver:', error);
        toast.error('Failed to update driver');
        return false;
      }

      toast.success('Driver updated successfully!');
      await fetchDrivers();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update driver');
      return false;
    }
  };

  const deleteDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) {
        console.error('Error deleting driver:', error);
        toast.error('Failed to delete driver');
        return false;
      }

      toast.success('Driver deleted successfully!');
      await fetchDrivers();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete driver');
      return false;
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  return {
    drivers,
    loading,
    addDriver,
    updateDriver,
    deleteDriver,
    refetch: fetchDrivers
  };
};
