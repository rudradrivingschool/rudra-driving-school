/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Plus, X } from 'lucide-react';
import { Client, Ride } from '@/types/client';
import { PersonalInfoCard } from './client/PersonalInfoCard';
import { PackageInfoCard } from './client/PackageInfoCard';
import { LicenseStatusCard } from './client/LicenseStatusCard';
import { RideProgressCard } from './client/RideProgressCard';
import { RideHistoryCard } from './client/RideHistoryCard';
import { AdditionalNotesCard } from './client/AdditionalNotesCard';
import { PaymentDialog } from './PaymentDialog';
import { usePayments } from '@/hooks/usePayments';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

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
  const { getPaymentsByAdmission, refetch } = usePayments();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Subscribe to the shared ['rides'] query — deduplicates against useRides() cache.
  // queryFn only fires if cache is cold (e.g., Admissions tab opened before Rides tab).
  const { data: allRidesRaw = [] } = useQuery({
    queryKey: ['rides'],
    queryFn: async () => {
      const data = await apiClient.getRides();
      return data || [];
    },
    enabled: isOpen && client !== null,
  });

  // Subscribe to the shared ['drivers'] query — deduplicates against useDrivers() cache.
  const { data: allDriversRaw = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const data = await apiClient.getDrivers();
      return data || [];
    },
    enabled: isOpen && client !== null,
  });

  // Build driver id->name map from shared cache
  const driverById: Record<string, string> = {};
  (allDriversRaw as any[]).forEach((d: any) => {
    driverById[d.id] = d.name;
  });

  // Derive rideHistory for this client by in-memory join on client_id (with legacy name fallback)
  const rideHistory: Ride[] = (allRidesRaw as any[])
    .filter((r: any) => {
      if (client === null) return false;
      if (r.client_id != null) return r.client_id === client.id;
      // Legacy rides: matched by client_name, no client_id
      return r.client_name === client.name && r.client_id === null;
    })
    .map((r: any) => ({
      id: r.id,
      date: r.date ? new Date(`${r.date}T00:00:00`) : new Date(),
      time: r.time ?? '',
      status: r.status as Ride['status'],
      driverName: driverById[r.driver_id] || 'Unknown',
      car: r.car || '',
    }));

  if (!client) return null;

  const existingPayments = getPaymentsByAdmission(client.id);
  const totalPaid = existingPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const remainingBalance = client.fees - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 pt-2 sm:p-6 [&>button]:z-50'>
        {/* Mobile Header - Fixed */}
        <DialogHeader className='flex-shrink-0 px-4 py-4 sm:px-0 sm:py-0 border-b sm:border-b-0 bg-white sticky top-0 z-40'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 pr-10 sm:pr-14'>
            <div className='flex-1 min-w-0'>
              <DialogTitle className='flex items-center gap-2 text-base sm:text-lg'>
                <Eye className='w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0' />
                <span className='truncate'>Client Details - {client.name}</span>
              </DialogTitle>
              <DialogDescription className='text-xs sm:text-sm mt-1'>
                Complete information and ride history for this client
              </DialogDescription>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2 flex-shrink-0'>
              {totalPaid < client.fees && (
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  size='sm'
                  className='bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 sm:px-3 relative z-30'
                >
                  <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
                  <span className='hidden xs:inline'>Add Payment</span>
                  <span className='xs:hidden'>Add Payment</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-0'>
          <div className='space-y-4 sm:space-y-6 py-4 sm:py-0'>
            <PersonalInfoCard client={client} />
            <PackageInfoCard client={client} totalPaid={totalPaid} />
            <LicenseStatusCard client={client} />
            <RideProgressCard client={client} />
            <RideHistoryCard rideHistory={rideHistory} />
            {client.additionalNotes && (
              <AdditionalNotesCard notes={client.additionalNotes} />
            )}
          </div>
        </div>

        {/* Desktop Close Button - Fixed at bottom */}
        <div className='hidden sm:flex justify-end pt-4 border-t flex-shrink-0'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Mobile Bottom Padding */}
        <div className='h-4 sm:hidden flex-shrink-0' />
      </DialogContent>

      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        admissionId={client.id}
        studentName={client.name}
        existingPayments={existingPayments}
        remainingBalance={remainingBalance}
        onPaymentAdded={refetch}
      />
    </Dialog>
  );
};