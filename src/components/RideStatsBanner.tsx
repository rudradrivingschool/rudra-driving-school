
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Car } from "lucide-react";

interface RideStatsBannerProps {
  todayRidesCount: number;
  completedRidesThisMonth: number;
  totalRides: number;
}

export const RideStatsBanner: React.FC<RideStatsBannerProps> = ({
  todayRidesCount,
  completedRidesThisMonth,
  totalRides,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-xs sm:text-sm text-blue-700">Today's Rides</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-800">{todayRidesCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-xs sm:text-sm text-green-700">Rides This Month</p>
            <p className="text-xl sm:text-2xl font-bold text-green-800">
              {completedRidesThisMonth}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-purple-600" />
          <div>
            <p className="text-xs sm:text-sm text-purple-700">Total Rides</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-800">{totalRides}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

