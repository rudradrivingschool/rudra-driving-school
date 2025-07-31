import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Car,
  Calendar as CalendarIcon,
  User,
  Edit,
  Trash2,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { AddRideForm } from './AddRideForm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useRides } from '@/hooks/useRides';
import { RideStatsBanner } from './RideStatsBanner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Define types for clarity
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

interface Client {
  id: string;
  name: string;
  status: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Car {
  id: string;
  name: string;
}

interface RideManagerProps {
  userRole: string;
}

// Remove local Client interface, use a minimal RideClient for this file
type RideClient = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

export const RideManager = ({ userRole }: RideManagerProps) => {
  const [clients, setClients] = useState<RideClient[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Fetch drivers (same as before)
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoadingClients(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, status,username')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch drivers');
        setDrivers([]);
      } else {
        setDrivers(
          (data || [])
            .filter(
              (row: any) =>
                (row.status?.toLowerCase?.() || '') === 'active' &&
                row.username !== 'root' // <-- Exclude root user here
            )
            .map((row: any) => ({
              id: row.id,
              name: row.name,
            }))
        );
      }
      setIsLoadingClients(false);
    };
    fetchDrivers();
  }, []);

  // Use the enhanced rides hook with update and delete functionality
  const { rides, isLoading, addRide, updateRide, deleteRide, clientNameToId } =
    useRides({ drivers });

  // Get current logged in driver (defaulting to first driver for demo)
  const currentDriver = drivers[0] || { id: '', name: '' };
  const cars: Car[] = [
    { id: '1', name: 'Tata Harrier' },
    { id: '2', name: 'MS Baleno' },
    { id: '3', name: 'MS SX4' },
  ];

  // Fetch clients from admissions table (active/inactive)
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      const { data, error } = await supabase
        .from('admissions')
        .select('id, student_name, status')
        .order('student_name', { ascending: true });

      if (error) {
        toast.error('Failed to fetch clients');
        setClients([]);
      } else {
        setClients(
          (data || []).map((row: any) => ({
            id: row.id,
            name: row.student_name,
            status:
              row.status && row.status.toLowerCase() === 'active'
                ? 'active'
                : 'inactive',
          }))
        );
      }
      setIsLoadingClients(false);
    };
    fetchClients();
  }, []);

  // Get current date info
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Completed rides in the current month
  const completedRidesThisMonth = rides.filter(
    (r) =>
      r.status === 'completed' &&
      r.date.getMonth() === currentMonth &&
      r.date.getFullYear() === currentYear
  );

  // Filter rides by selected date
  const filteredRides = selectedDate
    ? rides.filter(
        (ride) =>
          format(ride.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      )
    : rides;

  const todayRides = rides.filter(
    (ride) => ride.date.toDateString() === new Date().toDateString()
  );

  // RideCard displays each ride (with superadmin actions)
  const RideCard = ({ ride }: { ride: Ride }) => (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
          <div>
            <CardTitle className='text-base sm:text-lg'>
              {ride.clientName}
            </CardTitle>
            <CardDescription className='flex items-center gap-2 mt-1'>
              <span className='inline-flex items-center gap-1'>
                <User className='w-3 h-3' />
                Driver: {ride.driverName}
              </span>
            </CardDescription>
          </div>
          <div className='text-right mt-2 sm:mt-0'>
            <div className='text-sm font-medium'>{ride.time}</div>
            <div className='text-xs text-gray-500'>
              {ride.date.toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3 sm:space-y-4'>
        <div className='flex items-center gap-2 text-sm'>
          <Car className='w-4 h-4 text-blue-600' />
          <span className='font-medium'>Car:</span>
          <span>{ride.car}</span>
        </div>
        {ride.notes && (
          <div className='p-3 bg-blue-50 rounded-lg'>
            <p className='text-sm text-blue-800'>
              <strong>Notes:</strong> {ride.notes}
            </p>
          </div>
        )}
        {/* Superadmin Actions */}
        {userRole === 'superadmin' && (
          <div className='flex gap-2 pt-2'>
            {/* Edit Button */}
            <Button
              variant='outline'
              size='sm'
              className='text-xs'
              onClick={() => handleEditRide(ride)}
              disabled={isLoading}
            >
              <Edit className='w-3 h-3 mr-1' />
              <span>Edit</span>
            </Button>
            {/* Delete Button */}
            <Button
              variant='outline'
              size='sm'
              className='text-xs text-red-600 hover:text-red-700 hover:bg-red-50'
              onClick={() => {
                setRideToDelete(ride);
                setShowDeleteModal(true);
              }}
              disabled={isLoading}
            >
              <Trash2 className='w-3 h-3 mr-1' />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Logic for updating a ride: superadmin only
  const handleEditRide = (ride: Ride) => {
    if (userRole !== 'superadmin') {
      toast.error('Only superadmins can edit rides');
      return;
    }
    setRideToEdit(ride);
    setShowEditForm(true);
  };

  // Actually deletes the ride using the hook
  const confirmDeleteRide = async () => {
    if (!rideToDelete) return;

    try {
      const success = await deleteRide(rideToDelete.id);
      if (success) {
        setShowDeleteModal(false);
        setRideToDelete(null);
        toast.success('Ride deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast.error('Failed to delete ride');
    }
  };

  // Update ride handler using the hook
  const handleUpdateRide = async (rideData: {
    clientName: string;
    driverName: string;
    car: string;
    notes?: string;
  }) => {
    if (!rideToEdit) return false;

    try {
      const success = await updateRide(rideToEdit.id, rideData);
      if (success) {
        setShowEditForm(false);
        setRideToEdit(null);
        toast.success('Ride updated successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating ride:', error);
      toast.error('Failed to update ride');
      setShowEditForm(false);
      setRideToEdit(null);
      return false;
    }
  };

  // Handle save ride (for new rides)
  const handleSaveRide = async (rideData: {
    clientName: string;
    driverName: string;
    car: string;
    notes?: string;
  }) => {
    try {
      const result = await addRide(rideData);
      if (result) {
        setShowAddForm(false);
        toast.success('Ride added successfully!');
      }
      return result;
    } catch (error) {
      console.error('Error adding ride:', error);
      toast.error('Failed to add ride');
      return false;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
        <div>
          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Ride Management
          </h2>
          <p className='text-gray-600 text-sm sm:text-base'>
            Manage driving lessons and schedules
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto mt-2 sm:mt-0'
          disabled={isLoading}
        >
          <Plus className='w-4 h-4 mr-2' />
          Add Ride
        </Button>
      </div>

      {/* Stats Banner */}
      <RideStatsBanner
        todayRidesCount={todayRides.length}
        completedRidesThisMonth={completedRidesThisMonth.length}
        totalRides={rides.length}
      />

      {/* Calendar and Rides */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6'>
        {/* Calendar */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>Select Date</CardTitle>
            <CardDescription className='text-xs sm:text-sm'>
              View rides for specific dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={setSelectedDate}
              className='rounded-md border-0 p-0 pointer-events-auto w-full'
            />
          </CardContent>
        </Card>

        {/* Rides List */}
        <Card className='lg:col-span-3'>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Rides for ${format(selectedDate, 'PPP')}`
                : 'All Rides'}
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm'>
              {selectedDate
                ? `Showing ${filteredRides.length} ride(s) for the selected date`
                : 'View and manage all driving lessons'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='text-center py-6 sm:py-8 text-gray-500'>
                Loading rides...
              </div>
            ) : filteredRides.length > 0 ? (
              <div className='grid gap-3 sm:gap-4'>
                {filteredRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            ) : (
              <div className='text-center py-6 sm:py-8'>
                <Car className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-base sm:text-lg font-semibold text-gray-600'>
                  {selectedDate
                    ? 'No rides scheduled for this date'
                    : 'No rides scheduled'}
                </h3>
                <p className='text-gray-500 text-xs sm:text-sm'>
                  {selectedDate
                    ? 'Try selecting a different date'
                    : 'Add your first ride to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Ride Form */}
      {(showAddForm || showEditForm) && (
        <AddRideForm
          clients={clients}
          drivers={drivers}
          cars={cars}
          currentDriver={currentDriver}
          onSave={showEditForm ? handleUpdateRide : handleSaveRide}
          onCancel={() => {
            setShowAddForm(false);
            setShowEditForm(false);
            setRideToEdit(null);
          }}
          ride={showEditForm && rideToEdit ? rideToEdit : undefined}
          isLoading={isLoading}
        />
      )}

      {/* Ride Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ride</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the ride for{' '}
              <strong>{rideToDelete?.clientName}</strong> on{' '}
              <strong>{rideToDelete?.date.toLocaleDateString()}</strong>?
              <br />
              <br />
              This action cannot be undone and will also update the client's
              admission progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteModal(false);
                setRideToDelete(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRide}
              className='bg-red-600 text-white hover:bg-red-700'
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Ride'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
