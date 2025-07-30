
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Car } from "lucide-react";
import { format } from "date-fns";
import { Ride } from "@/types/client";

const getRideStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface RideHistoryCardProps {
  rideHistory: Ride[];
}

export const RideHistoryCard: React.FC<RideHistoryCardProps> = ({ rideHistory }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Ride History</CardTitle>
    </CardHeader>
    <CardContent>
      {rideHistory.length > 0 ? (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rideHistory.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell>
                    {typeof ride.date === "string"
                      ? format(new Date(ride.date), "MMM dd, yyyy")
                      : ride.date instanceof Date
                      ? format(ride.date, "MMM dd, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>{ride.time}</TableCell>
                  <TableCell>{ride.driverName}</TableCell>
                  <TableCell>{ride.car || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getRideStatusColor(ride.status)}>
                      {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No ride history available</p>
        </div>
      )}
    </CardContent>
  </Card>
);
