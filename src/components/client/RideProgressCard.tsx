import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Client } from "@/types/client";

interface RideProgressCardProps {
  client: Client;
}

export const RideProgressCard: React.FC<RideProgressCardProps> = ({ client }) => {
  const completed = typeof client.ridesCompleted === "number"
    ? client.ridesCompleted
    : client.rides?.completed ?? 0;
  const total =
    typeof client.totalRides === "number"
      ? client.totalRides
      : client.rides?.total ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = Math.max(0, total - completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ride Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              Progress: {completed} of {total} rides completed
            </span>
            <span className="text-sm text-gray-600">{percent}%</span>
          </div>
          <Progress value={percent} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow-600">{remaining}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
