import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/client';
import { usePayments } from '@/hooks/usePayments';
import { format } from 'date-fns';

interface PackageInfoCardProps {
  client: Client;
  totalPaid: number;
}

export const PackageInfoCard: React.FC<PackageInfoCardProps> = ({
  client,
  totalPaid,
}) => {
  const { getPaymentsByAdmission } = usePayments();
  const payments = getPaymentsByAdmission(client.id);
  const remainingAmount = client.fees - totalPaid;

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
        return 'Other Payment';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Package & Financial Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <Label className='text-sm font-medium text-gray-600'>Package</Label>
            <p className='text-sm font-semibold'>{client.duration}</p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-600'>
              Total Fees
            </Label>
            <p className='text-sm font-semibold'>
              ₹{client.fees.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-600'>
              Total Paid
            </Label>
            <p className='text-sm font-semibold text-green-600'>
              ₹{totalPaid.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-600'>
              Remaining Balance
            </Label>
            <p
              className={`text-sm font-semibold ${
                remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              ₹{remainingAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-600'>
              Start Date
            </Label>
            <p className='text-sm font-semibold'>
              {typeof client.startDate === 'string'
                ? format(new Date(client.startDate), 'MMM dd, yyyy')
                : client.startDate instanceof Date
                ? format(client.startDate, 'MMM dd, yyyy')
                : '-'}
            </p>
          </div>
        </div>

        {payments.length > 0 && (
          <div className='mt-6'>
            <Label className='text-sm font-medium text-gray-600 mb-3 block'>
              Payment History
            </Label>
            <div className='space-y-2'>
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className='flex justify-between items-center p-3 bg-gray-50 rounded-md'
                >
                  <div>
                    <p className='text-sm font-medium'>
                      {getPaymentTypeLabel(payment.payment_type)}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>{payment.notes}</div>
                  <p className='text-sm font-semibold text-green-600'>
                    ₹{payment.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
