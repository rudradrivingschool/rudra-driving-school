import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ClientDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onConfirm: () => void;
}

export const ClientDeleteModal: React.FC<ClientDeleteModalProps> = ({
  open,
  onOpenChange,
  clientName,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState('');

  React.useEffect(() => {
    if (!open) setConfirmText('');
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className='font-semibold'>{clientName}</span>?<br />
            This action cannot be undone. <br />
            Please type <span className='font-bold'>delete</span> below to
            confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          autoFocus
          placeholder='Type delete to confirm'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild disabled={confirmText !== 'delete'}>
            <Button
              variant='default'
              disabled={confirmText !== 'delete'}
              onClick={onConfirm}
              type='button'
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
