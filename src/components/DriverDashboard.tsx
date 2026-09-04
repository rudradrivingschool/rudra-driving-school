import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useDrivers } from "@/hooks/useDrivers";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Car } from "lucide-react";

// Util: Get month short string
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getMonthLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
};

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { drivers, loading: driversLoading } = useDrivers();

  // Match logged-in user to driver in shared drivers cache
  const matchingDriver = useMemo(() => {
    if (!user?.username) return undefined;
    return drivers.find((d) => d.username === user.username);
  }, [user, drivers]);

  const driverId = matchingDriver?.id;

  // Fetch driver-scoped rides using React Query
  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ["rides", { driver_id: driverId }],
    queryFn: () => apiClient.getRides({ driver_id: driverId! }),
    enabled: !!driverId,
  });

  // Derive totalRides from rides array
  const totalRides = rides.length;

  // Derive monthlyData from rides using useMemo
  const monthlyData = useMemo(() => {
    if (!rides.length) return [];

    const monthlyMap: { [k: string]: number } = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rides.forEach((ride: any) => {
      if (!ride.date) return;
      const label = getMonthLabel(ride.date);
      monthlyMap[label] = (monthlyMap[label] || 0) + 1;
    });

    // Sort by date ascending
    const sorted = Object.entries(monthlyMap)
      .map(([month, rides]) => ({ month, rides }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");
        const aIdx = monthNames.indexOf(aMonth);
        const bIdx = monthNames.indexOf(bMonth);
        const aYearNum = parseInt(aYear.replace("'", ""));
        const bYearNum = parseInt(bYear.replace("'", ""));
        return aYear === bYear
          ? aIdx - bIdx
          : aYearNum - bYearNum;
      });
    return sorted;
  }, [rides]);

  const loading = driversLoading || (driverId && ridesLoading);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-800">My Rides Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-blue-700">Total Rides</CardTitle>
            <Car className="w-6 h-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {loading ? "..." : totalRides}
            </div>
            <p className="text-xs text-blue-600 mt-1">Completed as of this month</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 flex-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-green-800">Monthly Ride Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {loading ? (
                <div className="text-center py-10 text-gray-400">Loading stats...</div>
              ) : monthlyData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" stroke="#52525b" fontSize={12} />
                    <YAxis stroke="#52525b" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="rides" fill="#37A47C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-gray-400">No ride data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
