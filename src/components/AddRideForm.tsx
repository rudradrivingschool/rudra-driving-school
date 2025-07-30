import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface Driver {
  id: string;
  name: string;
}

interface Car {
  id: string;
  name: string;
}

// NEW: Define Ride to support editing
interface Ride {
  id: string;
  clientName: string;
  driverName: string;
  car: string;
  date: Date;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

// Add `ride?: Ride` for edit mode
interface AddRideFormProps {
  clients: Client[];
  drivers: Driver[];
  cars: Car[];
  currentDriver: Driver;
  onSave: (rideData: {
    clientName: string;
    driverName: string;
    car: string;
    notes?: string;
  }) => void | Promise<any>;
  isLoading?: boolean;
  onCancel: () => void;
  ride?: Ride; // <-- NEW
}

export const AddRideForm = ({
  clients,
  drivers,
  cars,
  currentDriver,
  onSave,
  onCancel,
  ride, // <-- NEW
}: AddRideFormProps) => {
  const { user } = useAuth();
  // If we are editing receive ride, otherwise blank form
  const [formData, setFormData] = useState({
    clientName: ride ? ride.clientName : '',
    driverName: ride ? ride.driverName : currentDriver.name,
    car: ride ? ride.car : '',
    notes: ride ? ride.notes || '' : '',
  });

  // If ride changes (e.g. on modal open), update formData
  useEffect(() => {
    if (ride) {
      setFormData({
        clientName: ride.clientName,
        driverName: ride.driverName,
        car: ride.car,
        notes: ride.notes || '',
      });
    } else {
      setFormData({
        clientName: '',
        driverName: user.name,
        car: '',
        notes: '',
      });
    }
  }, [ride]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.clientName || !formData.driverName || !formData.car) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      clientName: formData.clientName,
      driverName: formData.driverName,
      car: formData.car,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>{ride ? 'Edit Ride' : 'Add New Ride'}</CardTitle>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <X className='w-4 h-4' />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='clientName'>Client Name *</Label>
                <select
                  id='clientName'
                  value={formData.clientName}
                  onChange={(e) =>
                    handleInputChange('clientName', e.target.value)
                  }
                  className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm'
                  required
                  disabled={!!ride} // Prevent changing client if editing (optional, remove if edit allowed)
                >
                  <option value=''>Select a client</option>
                  {clients
                    .filter((client) => client.status === 'active')
                    .map((client) => (
                      <option key={client.id} value={client.name}>
                        {client.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='driverName'>Driver Name *</Label>
                <select
                  id='driverName'
                  value={formData.driverName}
                  onChange={(e) =>
                    handleInputChange('driverName', e.target.value)
                  }
                  className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm'
                  required
                  disabled={!!ride || user.role == 'driver'} // Prevent editing driver for edit
                >
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.name}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='car'>Select Car *</Label>
                <select
                  id='car'
                  value={formData.car}
                  onChange={(e) => handleInputChange('car', e.target.value)}
                  className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm'
                  required
                >
                  <option value=''>Select a car</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.name}>
                      {car.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes (Optional)</Label>
              <textarea
                id='notes'
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder='Any special instructions or focus areas...'
                className='w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y'
              />
            </div>

            <div className='bg-blue-50 p-4 rounded-lg'>
              <p className='text-sm text-blue-800'>
                <strong>Note:</strong> Date and time will be automatically set
                to current date and time when the ride is{' '}
                {ride ? 'updated' : 'added'}.
              </p>
            </div>

            <div className='flex justify-end space-x-4 pt-4'>
              <Button type='button' variant='outline' onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              >
                {ride ? 'Save Changes' : 'Add Ride'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
