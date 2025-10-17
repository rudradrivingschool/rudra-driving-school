import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { X, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Utils: normalize time to HTML time input "HH:mm"
const toTimeInputValue = (t?: string) => {
  if (!t) return '';
  const s = t.trim();
  const ampmMatch = s.match(/(AM|PM)$/i);
  if (ampmMatch) {
    const cleaned = s.replace(/\s?(AM|PM)$/i, '');
    const [hStr, mStr = '00'] = cleaned.split(':');
    let h = parseInt(hStr, 10);
    if (/pm/i.test(ampmMatch[0]) && h < 12) h += 12;
    if (/am/i.test(ampmMatch[0]) && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(mStr).padStart(2, '0')}`;
  }
  const parts = s.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`;
  }
  return s;
};

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
    customDate?: Date;
    customTime?: string;
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
  const isSuperAdmin = user?.role === 'superadmin';
  
  // Get current date and time for defaults
  const now = new Date();
  const currentTimeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  // If we are editing receive ride, otherwise blank form
  const [formData, setFormData] = useState({
    clientName: ride ? ride.clientName : '',
    driverName: ride ? ride.driverName : (currentDriver?.name || user?.name || ''),
    car: ride ? ride.car : '',
    notes: ride ? ride.notes || '' : '',
  });

  const [selectedDate, setSelectedDate] = useState<Date>(ride ? ride.date : now);
  const [selectedTime, setSelectedTime] = useState<string>(
    ride ? toTimeInputValue(ride.time) : currentTimeStr
  );

  // If ride changes (e.g. on modal open), update formData
  useEffect(() => {
    if (ride) {
      setFormData({
        clientName: ride.clientName,
        driverName: ride.driverName,
        car: ride.car,
        notes: ride.notes || '',
      });
      setSelectedDate(ride.date);
      setSelectedTime(toTimeInputValue(ride.time));
    } else {
      const preferredDriver =
        currentDriver?.name ||
        user?.name ||
        (drivers && drivers.length > 0 ? drivers[0].name : '');
      setFormData({
        clientName: '',
        driverName: preferredDriver,
        car: '',
        notes: '',
      });
      setSelectedDate(now);
      setSelectedTime(currentTimeStr);
    }
  }, [ride, user?.name, currentDriver?.name, drivers]);

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
      customDate: isSuperAdmin ? selectedDate : undefined,
      customTime: isSuperAdmin ? selectedTime : undefined,
    });
  };

  return (
    <div className='fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card supports-[backdrop-filter]:bg-card backdrop-blur-0'>
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
                <Label>Client Name *</Label>
                <Select
                  value={formData.clientName}
                  onValueChange={(v) => handleInputChange('clientName', v)}
                  disabled={!!ride}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent className='z-50 bg-popover'>
                    {clients
                      .filter((client) => client.status === 'active')
                      .map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

              </div>

              <div className='space-y-2'>
                <Label>Driver Name *</Label>
                <Select
                  value={formData.driverName}
                  onValueChange={(v) => handleInputChange('driverName', v)}
                  disabled={!!ride || user?.role === 'driver'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                   <SelectContent className='z-50 bg-popover'>
                    {[...drivers]
                      .sort((a, b) => {
                        const preferred = formData.driverName || currentDriver?.name || user?.name || '';
                        if (a.name === preferred) return -1;
                        if (b.name === preferred) return 1;
                        return 0;
                      })
                      .map((driver) => (
                        <SelectItem key={driver.id} value={driver.name}>
                          {driver.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Select Car *</Label>
                <Select
                  value={formData.car}
                  onValueChange={(v) => handleInputChange('car', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a car" />
                  </SelectTrigger>
                  <SelectContent className='z-50 bg-popover'>
                    {cars.map((car) => (
                      <SelectItem key={car.id} value={car.name}>
                        {car.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Date and Time Selection for SuperAdmin */}
            {isSuperAdmin && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='time'>Time</Label>
                  <Input
                    id='time'
                    type='time'
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className='w-full'
                  />
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes (Optional)</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder='Any special instructions or focus areas...'
              />
            </div>

            {!isSuperAdmin && (
              <div className='bg-muted p-4 rounded-lg border border-border'>
                <p className='text-sm text-muted-foreground'>
                  <strong>Note:</strong> Date and time will be automatically set
                  to current date and time when the ride is{' '}
                  {ride ? 'updated' : 'added'}.
                </p>
              </div>
            )}

            {isSuperAdmin && (
              <div className='bg-muted p-4 rounded-lg border border-border'>
                <p className='text-sm text-muted-foreground'>
                  <strong>SuperAdmin Mode:</strong> You can customize the date and time for this ride.
                  Current defaults are set to now.
                </p>
              </div>
            )}

            <div className='flex justify-end space-x-4 pt-4'>
              <Button type='button' variant='outline' onClick={onCancel}>
                Cancel
              </Button>
              <Button type='submit'>
                {ride ? 'Save Changes' : 'Add Ride'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
