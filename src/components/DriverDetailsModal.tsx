import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Mail, Calendar, Car, Clock } from "lucide-react";
import { Driver } from "@/types/driver";
import { useState } from 'react';
import { useDriverDetails } from "@/hooks/useDriverDetails";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface DriverDetailsModalProps {
  driver: import("@/types/driver").Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DriverDetailsModal = ({ driver: driverProp, isOpen, onClose }: DriverDetailsModalProps) => {
  // Support for opening with driver from list, only fetch detailed backend data if there's a driver.
  const [page, setPage] = useState(1);

  const driverId = driverProp?.id ?? null;
  const { driver, rides, isLoading, totalRides, pageSize } = useDriverDetails(driverId, page);

  const totalPages = Math.max(1, Math.ceil(totalRides / pageSize));

  if (!driverProp) return null;

  // Calculate "This Month Rides"
  const currentDate = new Date();
  const thisMonth = currentDate.getMonth();
  const thisYear = currentDate.getFullYear();

  const thisMonthRides = rides.filter(ride => {
    const rideDate = new Date(ride.date);
    return (
      rideDate.getMonth() === thisMonth &&
      rideDate.getFullYear() === thisYear
    );
  }).length;

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'pending': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl">{driverProp.name}</DialogTitle>
            <p className="text-gray-600">Driver Details &amp; Ride History</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Driver Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {driverProp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{driverProp.name}</h3>
                    <Badge variant={driverProp.status === 'active' ? 'default' : 'secondary'} className={driverProp.status === 'active' ? 'bg-green-500' : ''}>
                      {driverProp.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {driverProp.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{driverProp.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{driverProp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Joined {new Date(driverProp.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span>License: {driverProp.licenseNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Username:</span> <span>{driverProp.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Role:</span> <span>{driverProp.role.charAt(0).toUpperCase() + driverProp.role.slice(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats from backend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {isLoading ? "..." : (driver ? driver.totalRides : 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Rides</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{isLoading ? "..." : thisMonthRides}</div>
                    <div className="text-sm text-gray-600">This Month Rides</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ride History with Pagination */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5" />
                Ride History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="py-10 text-gray-400 text-center">Loading ride data...</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Date &amp; Time</TableHead>
                          <TableHead>Car</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rides.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-400 py-8">No rides for this page.</TableCell>
                          </TableRow>
                        ) : rides.map((ride) => (
                          <TableRow key={ride.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{ride.clientName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                {ride.date ? new Date(ride.date).toLocaleDateString() : "-"}
                                <Clock className="w-3 h-3 ml-2" />
                                {ride.time}
                              </div>
                            </TableCell>
                            <TableCell>
                              {ride.car ? (
                                <Badge variant="outline" className="text-xs">{ride.car}</Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {ride.notes ? (
                                <span className="text-xs">{ride.notes}</span>
                              ) : (
                                <span className="text-gray-300 text-xs italic">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination controls */}
                    <div className="mt-4 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => page > 1 && setPage(page - 1)}
                              className={page === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {[...Array(totalPages)].map((_, idx) => (
                            <PaginationItem key={idx}>
                              <button
                                className={`px-3 py-1 rounded ${page === idx + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                                onClick={() => setPage(idx + 1)}
                              >
                                {idx + 1}
                              </button>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => page < totalPages && setPage(page + 1)}
                              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
