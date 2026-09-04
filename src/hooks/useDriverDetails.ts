
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ride {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
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
  status: "active" | "inactive";
  totalRides: number;
  rides: Ride[];
  username: string;
  password: string;
  role: "admin" | "driver";
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

    // Fetch driver info
    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", driverId)
      .single();

    if (driverError || !driverData) {
      setDriver(null);
      setRides([]);
      setTotalRides(0);
      setIsLoading(false);
      return;
    }

    // Fetch paginated rides
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: ridesData, count, error: ridesError } = await supabase
      .from("rides")
      .select("*", { count: "exact" })
      .eq("driver_id", driverId)
      .order("date", { ascending: false })
      .range(from, to);

    // Calculate total rides
    setTotalRides(count || 0);

    setDriver({
      id: driverData.id,
      name: driverData.name,
      phone: driverData.phone || "",
      email: driverData.email || "",
      licenseNumber: driverData.license_number || "",
      joinDate: driverData.join_date || "",
      status: (driverData.status as "active" | "inactive") || "active",
      totalRides: driverData.total_rides || count || 0,
      rides: [],
      username: driverData.username,
      password: driverData.password,
      role: (driverData.role as "admin" | "driver") || "driver"
    });

    setRides(
      (ridesData || []).map((r: any) => ({
        id: r.id,
        clientName: r.client_name,
        date: r.date,
        time: r.time,
        status: (r.status || "pending"),
        car: r.car,
        notes: r.notes,
      }))
    );
    setIsLoading(false);
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
