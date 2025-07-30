import React from 'react';
import { Client } from '@/types/client';
import { usePayments } from '@/hooks/usePayments';

interface ClientPaymentCellProps {
  client: Client;
}

export const ClientPaymentCell: React.FC<ClientPaymentCellProps> = ({ client }) => {
  const { getPaymentsByAdmission } = usePayments();
  const payments = getPaymentsByAdmission(client.id);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = client.fees - totalPaid;

  return (
    <div className='text-sm'>
      <div>₹{client.fees.toLocaleString()}</div>
      {totalPaid > 0 && (
        <div className='text-xs text-green-600'>
          Paid: ₹{totalPaid.toLocaleString()}
        </div>
      )}
      {remaining > 0 && (
        <div className='text-xs text-red-600'>
          Remaining: ₹{remaining.toLocaleString()}
        </div>
      )}
    </div>
  );
};