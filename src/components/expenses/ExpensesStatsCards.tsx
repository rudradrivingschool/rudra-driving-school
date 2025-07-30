import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  IndianRupee,
  Calendar as CalendarIcon,
  TrendingUp,
} from 'lucide-react';

interface ExpensesStatsCardsProps {
  total: number;
  thisMonth: number;
  avgPerMonth: number;
}

export const ExpensesStatsCards: React.FC<ExpensesStatsCardsProps> = ({
  total,
  thisMonth,
  avgPerMonth,
}) => (
  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
    <Card className='bg-gradient-to-br from-red-50 to-red-100 border-red-200'>
      <CardContent className='p-6'>
        <div className='flex items-center gap-3'>
          <IndianRupee className='w-8 h-8 text-red-600' />
          <div>
            <p className='text-sm text-red-700'>Total Expenses</p>
            <p className='text-2xl font-bold text-red-800'>
              ₹{total.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
      <CardContent className='p-6'>
        <div className='flex items-center gap-3'>
          <CalendarIcon className='w-8 h-8 text-orange-600' />
          <div>
            <p className='text-sm text-orange-700'>This Month</p>
            <p className='text-2xl font-bold text-orange-800'>
              ₹{thisMonth.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
      <CardContent className='p-6'>
        <div className='flex items-center gap-3'>
          <TrendingUp className='w-8 h-8 text-blue-600' />
          <div>
            <p className='text-sm text-blue-700'>Average/Month</p>
            <p className='text-2xl font-bold text-blue-800'>
              ₹{avgPerMonth.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
