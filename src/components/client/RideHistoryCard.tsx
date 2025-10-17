import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Calendar, Clock, User, CarFront } from 'lucide-react';

const getRideStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const RideHistoryCard = ({ rideHistory }) => (
  <Card className='w-full'>
    <CardHeader>
      <CardTitle className='text-lg flex items-center gap-2'>
        <Car className='w-5 h-5' />
        Ride History
      </CardTitle>
    </CardHeader>
    <CardContent>
      {rideHistory.length > 0 ? (
        <div className='space-y-4'>
          {/* Desktop Table View - Hidden on mobile */}
          <div className='hidden md:block'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-2 px-1 text-sm font-medium text-gray-600'>
                      Date
                    </th>
                    <th className='text-left py-2 px-1 text-sm font-medium text-gray-600'>
                      Time
                    </th>
                    <th className='text-left py-2 px-1 text-sm font-medium text-gray-600'>
                      Driver
                    </th>
                    <th className='text-left py-2 px-1 text-sm font-medium text-gray-600'>
                      Car
                    </th>
                    <th className='text-left py-2 px-1 text-sm font-medium text-gray-600'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rideHistory.map((ride) => (
                    <tr key={ride.id} className='border-b last:border-0'>
                      <td className='py-3 px-1 text-sm'>
                        {formatDate(ride.date)}
                      </td>
                      <td className='py-3 px-1 text-sm'>{ride.time}</td>
                      <td className='py-3 px-1 text-sm'>{ride.driverName}</td>
                      <td className='py-3 px-1 text-sm'>{ride.car || '-'}</td>
                      <td className='py-3 px-1'>
                        <Badge className={getRideStatusColor(ride.status)}>
                          {ride.status.charAt(0).toUpperCase() +
                            ride.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          {/* Mobile Card View - Hidden on desktop */}
          <div className='md:hidden space-y-3'>
            {rideHistory.map((ride) => (
              <div
                key={ride.id}
                className='bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white/80'
              >
                {/* Top Row: Date + Time stacked, Status Badge right */}
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-3'>
                    {/* Date + Time stacked */}
                    <div className='flex flex-col items-start'>
                      {/* Date (highlighted, blue bg) */}
                      <div className='flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg'>
                        <Calendar className='w-3.5 h-3.5 text-blue-500' />
                        <span className='font-semibold text-blue-700 text-sm'>
                          {formatDate(ride.date)}
                        </span>
                      </div>
                      {/* Time (smaller, gray bg, subtle) */}
                      <div className='flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-lg mt-1'>
                        <Clock className='w-3 h-3 text-gray-500' />
                        <span className='text-gray-600 text-xs font-medium'>
                          {ride.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRideStatusColor(
                      ride.status
                    )} border-0`}
                  >
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </div>
                </div>

                {/* Bottom Row (unchanged) */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2'>
                      <div className='w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center'>
                        <User className='w-4 h-4 text-blue-600' />
                      </div>
                      <span className='text-gray-800 font-medium text-sm'>
                        {ride.driverName}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 text-gray-600'>
                    <CarFront className='w-4 h-4' />
                    <span className='text-sm'>{ride.car || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='text-center py-8'>
          <Car className='w-12 h-12 text-gray-400 mx-auto mb-2' />
          <p className='text-gray-500'>No ride history available</p>
        </div>
      )}
    </CardContent>
  </Card>
);
