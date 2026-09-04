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
}) => {
  const totalExpenses = breakdownExpenses.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return (
    <Card className='bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border border-red-200/50 shadow-xl w-full overflow-hidden'>
      <CardHeader className='pb-4 sm:pb-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg sm:text-xl font-semibold text-red-800 flex items-center gap-2 sm:gap-3'>
              <div className='p-2 sm:p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg flex-shrink-0'>
                <TrendingDown className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
              </div>
              <span className='truncate'>Monthly Expense Breakdown</span>
            </CardTitle>
            <CardDescription className='text-red-700 mt-1 sm:mt-2 text-sm'>
              View detailed breakdown of expenses for selected period.
            </CardDescription>
          </div>
          <div className='flex items-center gap-2 text-xs font-medium text-red-700 bg-gradient-to-r from-red-100 to-rose-100 px-3 py-2 rounded-full border border-red-200/50 flex-shrink-0'>
            <Calendar className='h-3 w-3' />
            <span className='whitespace-nowrap'>
              Total: ₹{totalExpenses.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-4 sm:px-6'>
        <div className='flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6'>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className='w-full sm:w-[140px] bg-white border-red-200'>
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
            <SelectTrigger className='w-full sm:w-[110px] bg-white border-red-200'>
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
            <div className='text-center py-6 sm:py-8'>
              <div className='bg-white/60 rounded-xl p-4 sm:p-6 border border-red-200/50 mx-auto max-w-sm'>
                <TrendingDown className='w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3' />
                <h3 className='text-base sm:text-lg font-semibold text-red-700 mb-2'>
                  No expenses found
                </h3>
                <p className='text-sm sm:text-base text-red-600'>
                  No expenses were recorded during this month.
                </p>
              </div>
            </div>
          )}

          {breakdownExpenses.map((expense) => (
            <div
              key={expense.id}
              className='flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-red-200/50 shadow-sm hover:shadow-md transition-shadow gap-3 sm:gap-4'
            >
              <div className='flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0'>
                <div
                  className='p-2 sm:p-3 rounded-lg shadow-md flex-shrink-0'
                  style={{
                    backgroundColor: `${categoryColors[expense.category]}20`,
                  }}
                >
                  <span style={{ color: categoryColors[expense.category] }}>
                    {getCategoryIcon(expense.category)}
                  </span>
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1'>
                    <h3 className='font-semibold text-red-900 text-sm sm:text-base truncate'>
                      {expense.description}
                    </h3>
                    <span
                      className='text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto flex-shrink-0'
                      style={{
                        backgroundColor: `${
                          categoryColors[expense.category]
                        }15`,
                        color: categoryColors[expense.category],
                        border: `1px solid ${
                          categoryColors[expense.category]
                        }30`,
                      }}
                    >
                      {expense.category}
                    </span>
                  </div>
                  <p className='text-xs sm:text-sm text-red-700'>
                    {expense.date.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    })}
                  </p>
                </div>
              </div>

              <div className='flex items-center justify-between sm:justify-end gap-3 sm:gap-4'>
                <div className='text-right flex-shrink-0'>
                  <div className='text-lg sm:text-2xl font-bold text-red-700'>
                    ₹{expense.amount.toLocaleString()}
                  </div>
                  <div className='text-xs text-red-600 font-medium'>
                    Expense
                  </div>
                </div>
                {userRole === 'superadmin' && (
                  <div className='flex gap-1 sm:gap-2 flex-shrink-0'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onEdit(expense)}
                      className='hover:bg-red-50 border-red-200 p-2'
                    >
                      <Edit className='w-3 h-3 sm:w-4 sm:h-4 text-red-600' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onDelete(expense.id)}
                      className='hover:bg-red-50 border-red-200 p-2'
                    >
                      <Trash2 className='w-3 h-3 sm:w-4 sm:h-4 text-red-600' />
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
};
