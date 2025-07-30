import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, Car, Clock } from 'lucide-react';
import { Driver } from '@/types/driver';

interface DriverStatsCardsProps {
  drivers: Driver[];
}

export const DriverStatsCards = ({ drivers }: DriverStatsCardsProps) => {
  const activeDrivers = drivers.filter((d) => d.status === 'active').length;
  const totalRides = drivers.reduce((sum, d) => sum + d.totalRides, 0);

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
        <CardContent className='p-4 sm:p-6'>
          <div className='flex items-center gap-3'>
            <UserCheck className='w-6 h-6 sm:w-8 sm:h-8 text-blue-600' />
            <div>
              <p className='text-xs sm:text-sm text-blue-700'>Total Drivers</p>
              <p className='text-lg sm:text-2xl font-bold text-blue-800'>
                {drivers.length - 1}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
        <CardContent className='p-4 sm:p-6'>
          <div className='flex items-center gap-3'>
            <Car className='w-6 h-6 sm:w-8 sm:h-8 text-green-600' />
            <div>
              <p className='text-xs sm:text-sm text-green-700'>
                Active Drivers
              </p>
              <p className='text-lg sm:text-2xl font-bold text-green-800'>
                {activeDrivers - 1}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
        <CardContent className='p-4 sm:p-6'>
          <div className='flex items-center gap-3'>
            <Clock className='w-6 h-6 sm:w-8 sm:h-8 text-purple-600' />
            <div>
              <p className='text-xs sm:text-sm text-purple-700'>Total Rides</p>
              <p className='text-lg sm:text-2xl font-bold text-purple-800'>
                {totalRides}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
