import React, { useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Payment } from '@/hooks/usePayments';
import { Client } from '@/types/client';
import { CalendarDays, IndianRupee, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CollectionsBreakdownProps {
  months: string[];
  years: number[];
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  payments: Payment[];
  clients: Client[];
  userRole: string;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
}

const getPaymentTypeLabel = (type: string) => {
  switch (type) {
    case 'advance':
      return 'Advance';
    case 'installment_1':
      return '1st Installment';
    case 'installment_2':
      return '2nd Installment';
    case 'installment_3':
      return '3rd Installment';
    default:
      return 'Other';
  }
};

const getPaymentTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'advance':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'installment_1':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'installment_2':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'installment_3':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const CollectionsBreakdown: React.FC<CollectionsBreakdownProps> = ({
  months,
  years,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  payments,
  clients,
  userRole,
  onEdit,
  onDelete,
}) => {
  const breakdownPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const paymentDate = new Date(payment.payment_date);
        return (
          paymentDate.getMonth() === selectedMonth &&
          paymentDate.getFullYear() === selectedYear
        );
      })
      .map((payment) => {
        const client = clients.find((c) => c.id === payment.admission_id);
        return {
          ...payment,
          clientName: client?.name || 'Unknown Client',
        };
      })
      .sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime()
      );
  }, [payments, clients, selectedMonth, selectedYear]);

  const totalCollected = breakdownPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return (
    <Card className='bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200/50 shadow-xl w-full overflow-hidden'>
      <CardHeader className='pb-4 sm:pb-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg sm:text-xl font-semibold text-emerald-800 flex items-center gap-2 sm:gap-3'>
              <div className='p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg flex-shrink-0'>
                <IndianRupee className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
              </div>
              <span className='truncate'>Monthly Collections</span>
            </CardTitle>
            <CardDescription className='text-emerald-700 mt-1 sm:mt-2 text-sm'>
              View detailed breakdown of payments collected.
            </CardDescription>
          </div>
          <div className='flex items-center gap-2 text-xs font-medium text-emerald-700 bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-2 rounded-full border border-emerald-200/50 flex-shrink-0'>
            <CalendarDays className='h-3 w-3' />
            <span className='whitespace-nowrap'>
              Total: ₹{totalCollected.toLocaleString()}
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
            <SelectTrigger className='w-full sm:w-[140px] bg-white border-emerald-200'>
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
            <SelectTrigger className='w-full sm:w-[110px] bg-white border-emerald-200'>
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
          {breakdownPayments.length === 0 && (
            <div className='text-center py-6 sm:py-8'>
              <div className='bg-white/60 rounded-xl p-4 sm:p-6 border border-emerald-200/50 mx-auto max-w-sm'>
                <IndianRupee className='w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 mx-auto mb-3' />
                <h3 className='text-base sm:text-lg font-semibold text-emerald-700 mb-2'>
                  No collections found
                </h3>
                <p className='text-sm sm:text-base text-emerald-600'>
                  No payments were collected during {months[selectedMonth]}{' '}
                  {selectedYear}.
                </p>
              </div>
            </div>
          )}

          {breakdownPayments.map((payment) => (
            <div
              key={payment.id}
              className='flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-md transition-shadow gap-3 sm:gap-4'
            >
              <div className='flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0'>
                <div className='p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md flex-shrink-0'>
                  <IndianRupee className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1'>
                    <h3 className='font-semibold text-emerald-900 text-sm sm:text-base truncate'>
                      {payment.clientName}
                    </h3>
                    <Badge
                      variant='outline'
                      className={`text-xs font-medium self-start sm:self-auto ${getPaymentTypeBadgeColor(
                        payment.payment_type
                      )} flex-shrink-0`}
                    >
                      {getPaymentTypeLabel(payment.payment_type)}
                    </Badge>
                  </div>
                  <p className='text-xs sm:text-sm text-emerald-700'>
                    {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                  </p>
                  {payment.notes && (
                    <p className='text-xs text-emerald-600 mt-1 italic line-clamp-2'>
                      {payment.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex items-center justify-between sm:justify-end gap-3 sm:gap-4'>
                <div className='text-right flex-shrink-0'>
                  <div className='text-lg sm:text-2xl font-bold text-emerald-700'>
                    ₹{payment.amount.toLocaleString()}
                  </div>
                  <div className='text-xs text-emerald-600 font-medium'>
                    Payment Received
                  </div>
                </div>
                {userRole === 'superadmin' && (
                  <div className='flex gap-1 sm:gap-2 flex-shrink-0'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onEdit(payment)}
                      className='hover:bg-emerald-50 border-emerald-200 p-2'
                    >
                      <Edit className='w-3 h-3 sm:w-4 sm:h-4 text-emerald-600' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onDelete(payment.id)}
                      className='hover:bg-emerald-50 border-emerald-200 p-2'
                    >
                      <Trash2 className='w-3 h-3 sm:w-4 sm:h-4 text-emerald-600' />
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
