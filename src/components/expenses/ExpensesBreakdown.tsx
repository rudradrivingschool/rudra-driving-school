import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, TrendingDown, Calendar } from 'lucide-react';

interface ExpensesBreakdownProps {
  months: string[];
  years: number[];
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  breakdownExpenses: any[];
  userRole: string;
  categoryColors: { [key: string]: string };
  getCategoryIcon: (category: string) => React.ReactNode;
  onEdit: (exp: any) => void;
  onDelete: (id: string) => void;
}

export const ExpensesBreakdown: React.FC<ExpensesBreakdownProps> = ({
  months,
  years,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  breakdownExpenses,
  userRole,
  categoryColors,
  getCategoryIcon,
  onEdit,
  onDelete,
}) => (
  <Card className='bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border border-red-200/50 shadow-xl'>
    <CardHeader className='pb-6'>
      <div className='flex items-center justify-between'>
        <div>
          <CardTitle className='text-xl font-semibold text-red-800 flex items-center gap-3'>
            <div className='p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg'>
              <TrendingDown className='h-5 w-5 text-white' />
            </div>
            Monthly Expense Breakdown
          </CardTitle>
          <CardDescription className='text-red-700 mt-2'>
            View detailed breakdown of expenses for a selected month and year.
          </CardDescription>
        </div>
        <div className='flex items-center gap-2 text-xs font-medium text-red-700 bg-gradient-to-r from-red-100 to-rose-100 px-3 py-2 rounded-full border border-red-200/50'>
          <Calendar className='h-3 w-3' />
          Total:{' '}
          {breakdownExpenses.reduce((sum, payment) => sum + payment.amount, 0)}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className='flex flex-row gap-2 mb-6'>
        <Select
          value={selectedMonth.toString()}
          onValueChange={(val) => setSelectedMonth(Number(val))}
        >
          <SelectTrigger className='w-[140px] bg-white border-red-200'>
            <SelectValue placeholder='Month' />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, idx) => (
              <SelectItem key={month} value={idx.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className='w-[110px] bg-white border-red-200'>
            <SelectValue placeholder='Year' />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-3'>
        {breakdownExpenses.length === 0 && (
          <div className='text-center py-8'>
            <div className='bg-white/60 rounded-xl p-6 border border-red-200/50'>
              <TrendingDown className='w-12 h-12 text-red-400 mx-auto mb-3' />
              <h3 className='text-lg font-semibold text-red-700 mb-2'>
                No expenses found
              </h3>
              <p className='text-red-600'>
                No expenses were recorded during this month.
              </p>
            </div>
          </div>
        )}

        {breakdownExpenses.map((expense) => (
          <div
            key={expense.id}
            className='flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-red-200/50 shadow-sm hover:shadow-md transition-shadow'
          >
            <div className='flex items-center gap-4 flex-1'>
              <div
                className='p-3 rounded-lg shadow-md'
                style={{
                  backgroundColor: `${categoryColors[expense.category]}20`,
                }}
              >
                <span style={{ color: categoryColors[expense.category] }}>
                  {getCategoryIcon(expense.category)}
                </span>
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-1'>
                  <h3 className='font-semibold text-red-900'>
                    {expense.description}
                  </h3>
                  <span
                    className='text-xs font-medium px-2 py-1 rounded-full'
                    style={{
                      backgroundColor: `${categoryColors[expense.category]}15`,
                      color: categoryColors[expense.category],
                      border: `1px solid ${categoryColors[expense.category]}30`,
                    }}
                  >
                    {expense.category}
                  </span>
                </div>
                <p className='text-sm text-red-700'>
                  {expense.date.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: '2-digit',
                    timeZone: 'Asia/Kolkata',
                  })}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <div className='text-right'>
                <div className='text-2xl font-bold text-red-700'>
                  ₹{expense.amount.toLocaleString()}
                </div>
                <div className='text-xs text-red-600 font-medium'>Expense</div>
              </div>
              {userRole === 'superadmin' && (
                <div className='flex gap-2 ml-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onEdit(expense)}
                    className='hover:bg-red-50 border-red-200'
                  >
                    <Edit className='w-4 h-4 text-red-600' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onDelete(expense.id)}
                    className='hover:bg-red-50 border-red-200'
                  >
                    <Trash2 className='w-4 h-4 text-red-600' />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
