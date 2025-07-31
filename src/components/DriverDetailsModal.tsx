import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Mail, Calendar, Car, Clock, User } from 'lucide-react';
import { Driver } from '@/types/driver';
import { useState } from 'react';
import { useDriverDetails } from '@/hooks/useDriverDetails';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface DriverDetailsModalProps {
  driver: import('@/types/driver').Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DriverDetailsModal = ({
  driver: driverProp,
  isOpen,
  onClose,
}: DriverDetailsModalProps) => {
  // Support for opening with driver from list, only fetch detailed backend data if there's a driver.
  const [page, setPage] = useState(1);

  const driverId = driverProp?.id ?? null;
  const { driver, rides, isLoading, totalRides, pageSize } = useDriverDetails(
    driverId,
    page
  );

  const totalPages = Math.max(1, Math.ceil(totalRides / pageSize));

  if (!driverProp) return null;

  // Calculate "This Month Rides"
  const currentDate = new Date();
  const thisMonth = currentDate.getMonth();
  const thisYear = currentDate.getFullYear();

  const thisMonthRides = rides.filter((ride) => {
    const rideDate = new Date(ride.date);
    return (
      rideDate.getMonth() === thisMonth && rideDate.getFullYear() === thisYear
    );
  }).length;

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'pending':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 sm:p-6 [&>button]:z-50'>
        {/* Header */}
        <DialogHeader className='flex-shrink-0 px-4 py-4 sm:px-0 sm:py-0 border-b sm:border-b-0 bg-white sticky top-0 z-40'>
          <div className='pr-10'>
            <DialogTitle className='text-lg sm:text-2xl flex items-center gap-2'>
              <User className='w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0' />
              <span className='truncate'>{driverProp.name}</span>
            </DialogTitle>
            <p className='text-sm sm:text-base text-gray-600 mt-1'>
              Driver Details & Ride History
            </p>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-0'>
          <div className='space-y-4 sm:space-y-6 py-4 sm:py-0'>
            {/* Driver Information */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
              {/* Personal Information Card */}
              <Card className='overflow-hidden'>
                <CardHeader className='pb-3 sm:pb-4'>
                  <CardTitle className='text-base sm:text-lg'>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3 sm:space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0'>
                      {driverProp.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h3 className='font-semibold text-sm sm:text-base truncate'>
                        {driverProp.name}
                      </h3>
                      <Badge
                        variant={
                          driverProp.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                        className={`text-xs ${
                          driverProp.status === 'active' ? 'bg-green-500' : ''
                        }`}
                      >
                        {driverProp.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className='space-y-2 sm:space-y-3'>
                    {driverProp.email && (
                      <div className='flex items-center gap-2 text-xs sm:text-sm'>
                        <Mail className='w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0' />
                        <span className='truncate'>{driverProp.email}</span>
                      </div>
                    )}
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <Phone className='w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0' />
                      <span>{driverProp.phone}</span>
                    </div>
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0' />
                      <span>
                        Joined{' '}
                        {new Date(driverProp.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <Car className='w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0' />
                      <span className='truncate'>
                        License: {driverProp.licenseNumber}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <span className='font-semibold flex-shrink-0'>
                        Username:
                      </span>
                      <span className='truncate'>{driverProp.username}</span>
                    </div>
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <span className='font-semibold flex-shrink-0'>Role:</span>
                      <span>
                        {driverProp.role.charAt(0).toUpperCase() +
                          driverProp.role.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card className='overflow-hidden'>
                <CardHeader className='pb-3 sm:pb-4'>
                  <CardTitle className='text-base sm:text-lg'>
                    Performance Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                    <div className='text-center p-3 sm:p-4 bg-green-50 rounded-lg'>
                      <div className='text-xl sm:text-2xl font-bold text-green-600'>
                        {isLoading ? '...' : driver ? driver.totalRides : 0}
                      </div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        Total Rides
                      </div>
                    </div>
                    <div className='text-center p-3 sm:p-4 bg-purple-50 rounded-lg'>
                      <div className='text-xl sm:text-2xl font-bold text-purple-600'>
                        {isLoading ? '...' : thisMonthRides}
                      </div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        This Month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ride History */}
            <Card className='overflow-hidden'>
              <CardHeader className='pb-3 sm:pb-4'>
                <CardTitle className='text-base sm:text-lg flex items-center gap-2'>
                  <Car className='w-4 h-4 sm:w-5 sm:h-5' />
                  Ride History
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0 sm:p-6'>
                <div className='overflow-x-auto'>
                  {isLoading ? (
                    <div className='py-8 sm:py-10 text-gray-400 text-center text-sm sm:text-base'>
                      Loading ride data...
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className='block sm:hidden space-y-3 p-4'>
                        {rides.length === 0 ? (
                          <div className='text-center text-gray-400 py-8 text-sm'>
                            No rides for this page.
                          </div>
                        ) : (
                          rides.map((ride) => (
                            <div
                              key={ride.id}
                              className='bg-gray-50 rounded-lg p-3 space-y-2'
                            >
                              <div className='flex items-center justify-between'>
                                <span className='font-medium text-sm truncate flex-1 mr-2'>
                                  {ride.clientName}
                                </span>
                                {ride.car && (
                                  <Badge
                                    variant='outline'
                                    className='text-xs flex-shrink-0'
                                  >
                                    {ride.car}
                                  </Badge>
                                )}
                              </div>
                              <div className='flex items-center gap-3 text-xs text-gray-600'>
                                <div className='flex items-center gap-1'>
                                  <Calendar className='w-3 h-3' />
                                  {ride.date
                                    ? new Date(ride.date).toLocaleDateString()
                                    : '-'}
                                </div>
                                <div className='flex items-center gap-1'>
                                  <Clock className='w-3 h-3' />
                                  {ride.time}
                                </div>
                              </div>
                              {ride.notes && (
                                <div className='text-xs text-gray-500 line-clamp-2'>
                                  {ride.notes}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Desktop Table View */}
                      <div className='hidden sm:block'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Car</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rides.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className='text-center text-gray-400 py-8'
                                >
                                  No rides for this page.
                                </TableCell>
                              </TableRow>
                            ) : (
                              rides.map((ride) => (
                                <TableRow
                                  key={ride.id}
                                  className='hover:bg-gray-50'
                                >
                                  <TableCell className='font-medium'>
                                    {ride.clientName}
                                  </TableCell>
                                  <TableCell>
                                    <div className='flex items-center gap-1 text-sm'>
                                      <Calendar className='w-3 h-3' />
                                      {ride.date
                                        ? new Date(
                                            ride.date
                                          ).toLocaleDateString()
                                        : '-'}
                                      <Clock className='w-3 h-3 ml-2' />
                                      {ride.time}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {ride.car ? (
                                      <Badge
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        {ride.car}
                                      </Badge>
                                    ) : (
                                      <span className='text-gray-400 text-xs'>
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {ride.notes ? (
                                      <span className='text-xs'>
                                        {ride.notes}
                                      </span>
                                    ) : (
                                      <span className='text-gray-300 text-xs italic'>
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination controls */}
                      <div className='mt-4 flex justify-center px-4 sm:px-0'>
                        <Pagination>
                          <PaginationContent className='flex-wrap gap-1'>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => page > 1 && setPage(page - 1)}
                                className={`text-xs sm:text-sm ${
                                  page === 1
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }`}
                              />
                            </PaginationItem>
                            {[...Array(Math.min(totalPages, 5))].map(
                              (_, idx) => {
                                const pageNum =
                                  totalPages <= 5
                                    ? idx + 1
                                    : page <= 3
                                    ? idx + 1
                                    : page >= totalPages - 2
                                    ? totalPages - 4 + idx
                                    : page - 2 + idx;

                                return (
                                  <PaginationItem key={pageNum}>
                                    <button
                                      className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                                        page === pageNum
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}
                                      onClick={() => setPage(pageNum)}
                                    >
                                      {pageNum}
                                    </button>
                                  </PaginationItem>
                                );
                              }
                            )}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  page < totalPages && setPage(page + 1)
                                }
                                className={`text-xs sm:text-sm ${
                                  page === totalPages
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }`}
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
        </div>

        {/* Mobile Bottom Padding */}
        <div className='h-4 sm:hidden flex-shrink-0' />
      </DialogContent>
    </Dialog>
  );
};
