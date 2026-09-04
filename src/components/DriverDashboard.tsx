
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car } from "lucide-react";

// Util: Get month short string
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getMonthLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
};

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<{ month: string; rides: number }[]>([]);
  const [totalRides, setTotalRides] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch rides for the logged-in driver
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      if (!user || !user.id) {
        setTotalRides(0);
        setMonthlyData([]);
        setLoading(false);
        return;
      }

      // Find driver record
      const driverRes = await supabase
        .from("drivers" as any)
        .select("id, name")
        .eq("username", user.username)
        .maybeSingle();
      const driverId = (driverRes.data as any)?.id;

      if (!driverId) {
        setTotalRides(0);
        setMonthlyData([]);
        setLoading(false);
        return;
      }

      // Fetch rides for this driver
      const { data: rides } = await supabase
        .from("rides" as any)
        .select("date")
        .eq("driver_id", driverId);

      // Total rides
      setTotalRides(rides?.length || 0);

      // Build monthly stats
      const monthlyMap: { [k: string]: number } = {};
      (rides || []).forEach((ride: any) => {
        if (!ride.date) return;
        const label = getMonthLabel(ride.date);
        monthlyMap[label] = (monthlyMap[label] || 0) + 1;
      });

      // Sort by date ascending
      const sorted = Object.entries(monthlyMap)
        .map(([month, rides]) => ({ month, rides }))
        .sort((a, b) => {
          // Parse year/month for proper sorting
          const [aMonth, aYear] = a.month.split(" ");
          const [bMonth, bYear] = b.month.split(" ");
          const aIdx = monthNames.indexOf(aMonth);
          const bIdx = monthNames.indexOf(bMonth);
          return aYear === bYear
            ? aIdx - bIdx
            : parseInt(aYear.replace("'", "")) - parseInt(bYear.replace("'", ""));
        });
      setMonthlyData(sorted);
      setLoading(false);
    };
    fetchStats();
    // eslint-disable-next-line
  }, [user]);

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
