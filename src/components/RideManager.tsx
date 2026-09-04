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
import { useRides } from '@/hooks/useRides';
import { useAdmissions } from '@/hooks/useAdmissions';
import { useDrivers } from '@/hooks/useDrivers';
import { RideStatsBanner } from './RideStatsBanner';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime12h } from '@/lib/utils';
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
  client_id?: string;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Use shared ['drivers'] React Query â€” no direct Supabase fetch needed.
  const { drivers: allDrivers, loading: driversLoading } = useDrivers();
  // Active non-root drivers only (same filter as the previous direct fetch)
  const drivers = allDrivers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((d) => d.status === 'active' && (d as any).username !== 'root')
    .map((d) => ({ id: d.id, name: d.name }));

  // Shared admissions data - triggers the ['admissions'] React Query.
  // Replaces the direct supabase.from('admissions') fetch that was here before.
  const { clients: admissionsClients } = useAdmissions();

  // Derive client list for dropdown from shared admissions data
  const clients: RideClient[] = admissionsClients.map((client) => ({
    id: client.id,
    name: client.name,
    status: client.status.toLowerCase() === 'active' ? 'active' : 'inactive',
  }));

  // Derive clientProgress from shared admissions data (replaces separate Supabase fetch)
  const clientProgress: Record<string, { completed: number; total: number }> = {};
  admissionsClients.forEach((client) => {
    clientProgress[client.id] = {
      completed: client.ridesCompleted,
      total: client.totalRides,
    };
  });

// Use the enhanced rides hook with update and delete functionality.
// Pass clients so useRides can derive clientNameToId without its own admissions fetch.
  const { rides, isLoading, addRide, updateRide, deleteRide, clientNameToId } =
    useRides({ drivers, clients: admissionsClients });

  // Auth user to determine current driver
  const { user } = useAuth();

  // Prefer logged-in driver (by id or name), fallback to first
  const currentDriver =
    (user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? drivers.find((d) => d.id === (user as any).id) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drivers.find((d) => d.name === (user as any).name)
      : undefined) ||
    drivers[0] ||
    { id: '', name: '' };
  const cars: Car[] = [
    { id: '1', name: 'Tata Harrier' },
    { id: '2', name: 'MS Baleno' },
    { id: '3', name: 'MS SX4' },
  ];

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
  const RideCard = ({ ride }: { ride: Ride }) => {
    const progress = ride.client_id ? clientProgress[ride.client_id] : null;
    const currentRide = progress ? progress.completed : 0;
    const totalRides = progress ? progress.total : 0;
    const remaining = totalRides - currentRide;

    return (
      <Card className='group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary/40 hover:border-l-primary overflow-hidden'>
        <CardContent className='p-4'>
          {/* Main Content Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start'>
            {/* Left Section - Client & Details */}
            <div className='space-y-3'>
              {/* Client Name & Driver */}
              <div>
                <h3 className='text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors'>
                  {ride.clientName}
                </h3>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <User className='w-4 h-4' />
                  <span>{ride.driverName}</span>
                </div>
              </div>

              {/* Car & Time Info Row */}
              <div className='flex flex-wrap items-center gap-3 text-sm'>
                {/* Car */}
                <div className='flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full'>
                  <Car className='w-4 h-4 text-blue-600' />
                  <span className='font-medium text-blue-900'>{ride.car}</span>
                </div>
                
                {/* Date & Time */}
                <div className='flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full'>
                  <CalendarIcon className='w-4 h-4 text-gray-600' />
                  <span className='font-medium text-gray-700'>{formatTime12h(ride.time)}</span>
                  <span className='text-gray-400'>â€¢</span>
                  <span className='text-gray-600 text-xs'>{ride.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Notes - Compact */}
              {ride.notes && (
                <div className='p-2.5 bg-amber-50/70 border-l-2 border-amber-400 rounded text-xs text-amber-900'>
                  <span className='font-semibold'>Note:</span> {ride.notes}
                </div>
              )}
            </div>

            {/* Right Section - Progress Badge */}
            {progress && totalRides > 0 && (
              <div className='flex lg:flex-col items-center lg:items-end gap-2'>
                <div className='relative group/badge hover:scale-110 transition-transform duration-300'>
                  {/* F1 Racing Style Badge */}
                  <div className='bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white px-5 py-3 rounded-xl shadow-lg relative overflow-hidden'>
                    {/* Animated Background Effect */}
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-700'></div>
                    
                    {/* Content */}
                    <div className='relative z-10 text-center'>
                      <div className='flex items-baseline justify-center gap-1 mb-1'>
                        <span className='text-3xl font-black leading-none'>{currentRide}</span>
                        <span className='text-sm font-bold opacity-90'>/{totalRides}</span>
                      </div>
                      <div className='text-[10px] font-bold uppercase tracking-widest opacity-90'>
                        Rides Done
                      </div>
                    </div>
                  </div>
                  
                  {/* Remaining Badge */}
                  <div className='absolute -bottom-2 -right-2 bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold shadow-md border-2 border-red-600'>
                    {remaining} left
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Superadmin Actions - Compact */}
          {userRole === 'superadmin' && (
            <div className='flex gap-2 mt-4 pt-3 border-t border-gray-100'>
              <Button
                variant='ghost'
                size='sm'
                className='flex-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-700'
                onClick={() => handleEditRide(ride)}
                disabled={isLoading}
              >
                <Edit className='w-3.5 h-3.5 mr-1.5' />
                Edit
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='flex-1 h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700'
                onClick={() => {
                  setRideToDelete(ride);
                  setShowDeleteModal(true);
                }}
                disabled={isLoading}
              >
                <Trash2 className='w-3.5 h-3.5 mr-1.5' />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
    customDate?: Date;
    customTime?: string;
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
    customDate?: Date;
    customTime?: string;
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