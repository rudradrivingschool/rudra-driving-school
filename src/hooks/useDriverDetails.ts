/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export interface Ride {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
  car?: string;
  notes?: string;
}

export interface DriverDetails {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  joinDate: string;
  status: 'active' | 'inactive';
  totalRides: number;
  rides: Ride[];
  username: string;
  password: string;
  role: 'admin' | 'driver';
}

export function useDriverDetails(driverId: string | null, page: number) {
  const [driver, setDriver] = useState<DriverDetails | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRides, setTotalRides] = useState<number>(0);

  const pageSize = 10;

  const fetchDriver = useCallback(async () => {
    if (!driverId) {
      setDriver(null);
      setRides([]);
      setTotalRides(0);
      return;
    }
    setIsLoading(true);

    try {
      // Fetch all drivers and find the one we need
      const drivers = await apiClient.getDrivers();
      const driverData = drivers.find((d: any) => d.id === driverId);

      if (!driverData) {
        setDriver(null);
        setRides([]);
        setTotalRides(0);
        setIsLoading(false);
        return;
      }

      // Fetch all rides for this driver
      const allRidesData = await apiClient.getRides({ driver_id: driverId });
      const count = allRidesData.length;

      // Sort by date descending and paginate
      const sortedRides = allRidesData.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedRides = sortedRides.slice(from, to);

      // Calculate total rides
      setTotalRides(count || 0);

      const driver = driverData as any;
      setDriver({
        id: driver.id,
        name: driver.name,
        phone: driver.phone || '',
        email: driver.email || '',
        licenseNumber: driver.license_number || '',
        joinDate: driver.join_date || '',
        status: (driver.status as 'active' | 'inactive') || 'active',
        totalRides: driver.total_rides || count || 0,
        rides: [],
        username: driver.username,
        password: driver.password,
        role: (driver.role as 'admin' | 'driver') || 'driver',
      });

      setRides(
        (paginatedRides || []).map((r: any) => ({
          id: r.id,
          clientName: r.client_name,
          date: r.date,
          time: r.time,
          status: r.status || 'pending',
          car: r.car,
          notes: r.notes,
        })),
      );
    } catch (error) {
      console.error('Error fetching driver details:', error);
      setDriver(null);
      setRides([]);
      setTotalRides(0);
    } finally {
      setIsLoading(false);
    }
  }, [driverId, page]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  return {
    driver,
    rides,
    isLoading,
    pageSize,
    totalRides,
  };
}
