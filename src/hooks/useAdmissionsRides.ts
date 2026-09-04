/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/lib/api/client';
import { Ride } from '@/types/client';

/**
 * Fetch all rides and progress for a client (by client_id, fallback to name)
 * Each ride in rideHistory will have driverName (driver's actual name) and car.
 */
export async function fetchClientRides(
  clientId: string,
  clientName: string,
): Promise<{
  progress: { completed: number; total: number };
  rideHistory: Ride[];
}> {
  // Step 1: Fetch rides by client_id (primary)
  const rides = await apiClient.getRides({ client_id: clientId });

  if (rides && rides.length > 0) {
    // Extract all unique driver_ids for lookup
    const uniqueDriverIds = Array.from(
      new Set(
        (rides as any[])
          .map((r: any) => r.driver_id)
          .filter((id): id is string => !!id && typeof id === 'string'),
      ),
    );

    // Fetch driver names in one go
    let driverMap: Record<string, string> = {};
    if (uniqueDriverIds.length > 0) {
      const drivers = await apiClient.getDrivers();
      driverMap = drivers
        .filter((d: any) => uniqueDriverIds.includes(d.id))
        .reduce((acc: Record<string, string>, d: any) => {
          acc[d.id] = d.name;
          return acc;
        }, {});
    }

    const completed = (rides as any[]).filter(
      (r: any) => r.status?.toLowerCase() === 'completed',
    ).length;
    const rideHistory: Ride[] = (rides as any[]).map((r: any) => ({
      id: r.id,
      date: new Date(r.date),
      time: r.time ?? '',
      status: r.status as Ride['status'],
      driverName: driverMap[r.driver_id] || 'Unknown',
      car: r.car || '',
    }));
    return { progress: { completed, total: rides.length }, rideHistory };
  }

  // Step 2: Fallback to legacy rides - by client_name if no rides (client_id is null, use client_name)
  const allRides = await apiClient.getRides();

  // Filter for rides where client_name matches and client_id is null
  const legacy = (allRides as any[]).filter(
    (r: any) => r.client_name === clientName && r.client_id === null,
  );

  if (legacy && legacy.length > 0) {
    // Extract unique driver_ids for legacy rides
    const uniqueDriverIds = Array.from(
      new Set(
        (legacy as any[])
          .map((r: any) => r.driver_id)
          .filter((id): id is string => !!id && typeof id === 'string'),
      ),
    );
    let driverMap: Record<string, string> = {};
    if (uniqueDriverIds.length > 0) {
      const drivers = await apiClient.getDrivers();
      driverMap = drivers
        .filter((d: any) => uniqueDriverIds.includes(d.id))
        .reduce((acc: Record<string, string>, d: any) => {
          acc[d.id] = d.name;
          return acc;
        }, {});
    }
    const completed = (legacy as any[]).filter(
      (r: any) => r.status?.toLowerCase() === 'completed',
    ).length;
    const rideHistory: Ride[] = (legacy as any[]).map((r: any) => ({
      id: r.id,
      date: new Date(r.date),
      time: r.time ?? '',
      status: r.status as Ride['status'],
      driverName: driverMap[r.driver_id] || 'Unknown',
      car: r.car || '',
    }));
    return { progress: { completed, total: legacy.length }, rideHistory };
  }

  // None found: no rides for this client
  return { progress: { completed: 0, total: 0 }, rideHistory: [] };
}
