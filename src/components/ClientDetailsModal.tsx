import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Plus } from 'lucide-react';
import { Client } from '@/types/client';
import { PersonalInfoCard } from './client/PersonalInfoCard';
import { PackageInfoCard } from './client/PackageInfoCard';
import { LicenseStatusCard } from './client/LicenseStatusCard';
import { RideProgressCard } from './client/RideProgressCard';
import { RideHistoryCard } from './client/RideHistoryCard';
import { AdditionalNotesCard } from './client/AdditionalNotesCard';
import { PaymentDialog } from './PaymentDialog';
import { usePayments } from '@/hooks/usePayments';

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientDetailsModal = ({
  client,
  isOpen,
  onClose,
}: ClientDetailsModalProps) => {
  const { getPaymentsByAdmission } = usePayments();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // DEBUG LOGS
  console.log('ClientDetailsModal: client', client);
  if (client) {
    console.log('ClientDetailsModal: client.rides', client.rides);
    console.log('ClientDetailsModal: client.rideHistory', client.rideHistory);
  }

  if (!client) return null;

  const existingPayments = getPaymentsByAdmission(client.id);
  const totalPaid = existingPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const remainingBalance = client.fees - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='flex items-center gap-2'>
                <Eye className='w-5 h-5' />
                Client Details - {client.name}
              </DialogTitle>
              <DialogDescription>
                Complete information and ride history for this client
              </DialogDescription>
            </div>
            {totalPaid < client.fees && (
              <Button
                onClick={() => setShowPaymentDialog(true)}
                size='sm'
                className='bg-green-600 hover:bg-green-700 mr-12'
              >
                <Plus className='w-4 h-4 mr-1' />
                Add Payment
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className='space-y-6'>
          <PersonalInfoCard client={client} />
          <PackageInfoCard client={client} totalPaid={totalPaid} />
          <LicenseStatusCard client={client} />
          <RideProgressCard client={client} />
          <RideHistoryCard rideHistory={client.rideHistory} />
          {client.additionalNotes && (
            <AdditionalNotesCard notes={client.additionalNotes} />
          )}
        </div>
        <div className='flex justify-end'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        admissionId={client.id}
        studentName={client.name}
        existingPayments={existingPayments}
        remainingBalance={remainingBalance}
      />
    </Dialog>
  );
};
