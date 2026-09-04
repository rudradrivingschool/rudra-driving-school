import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePayments } from '@/hooks/usePayments';
import { toast } from 'sonner';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  studentName: string;
  existingPayments: any[];
  remainingBalance: number;
  onPaymentAdded?: () => void;
}

export const PaymentDialog = ({
  isOpen,
  onClose,
  admissionId,
  studentName,
  existingPayments,
  remainingBalance,
  onPaymentAdded,
}: PaymentDialogProps) => {
  const { addPayment } = usePayments();
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine next payment type automatically
  const getNextPaymentType = () => {
    const usedPaymentTypes = existingPayments.map((p) => p.payment_type);

    // Count actual installments (excluding advance)
    const hasInstallment1 = usedPaymentTypes.includes('installment_1');
    const hasInstallment2 = usedPaymentTypes.includes('installment_2');
    const hasInstallment3 = usedPaymentTypes.includes('installment_3');

    if (!hasInstallment1) return 'installment_1';
    if (!hasInstallment2) return 'installment_2';
    if (!hasInstallment3) return 'installment_3';
    return 'other';
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'installment_1':
        return '1st Installment';
      case 'installment_2':
        return '2nd Installment';
      case 'installment_3':
        return '3rd Installment';
      default:
        return 'Final Payment';
    }
  };

  const nextPaymentType = getNextPaymentType();

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > remainingBalance) {
      toast.error(
        `Amount cannot exceed remaining balance of ₹${remainingBalance.toLocaleString()}`
      );
      return;
    }

    setLoading(true);

    const success = await addPayment({
      admission_id: admissionId,
      amount,
      payment_type: nextPaymentType as any,
      payment_date: new Date().toISOString().split('T')[0],
      notes,
    });

    if (success) {
      onPaymentAdded?.();
      onClose();
      setAmount(0);
      setNotes('');
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Add a new payment for {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>Payment Type</Label>
            <div className='p-3 bg-muted rounded-md'>
              <p className='text-sm font-medium'>
                {getPaymentTypeLabel(nextPaymentType)}
              </p>
              <p className='text-xs text-muted-foreground'>
                Auto-determined based on payment history
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='amount'>Amount (₹)</Label>
            <Input
              id='amount'
              type='number'
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              placeholder={`Enter amount (Max: ₹${remainingBalance.toLocaleString()})`}
              max={remainingBalance}
            />
            <p className='text-xs text-muted-foreground'>
              Remaining balance: ₹{remainingBalance.toLocaleString()}
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Payment Date</Label>
            <div className='p-3 bg-muted rounded-md'>
              <p className='text-sm font-medium'>
                {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className='text-xs text-muted-foreground'>
                Today's date (auto-set)
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes (Optional)</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add any notes about this payment...'
            />
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
