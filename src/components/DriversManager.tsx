import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { DriverForm } from './DriverForm';
import { DriverCard } from './DriverCard';
import { DriverEmptyState } from './DriverEmptyState';
import { DriverSearchFilter } from './DriverSearchFilter';
import { DriverStatsCards } from './DriverStatsCards';
import { DriverDetailsModal } from './DriverDetailsModal';
import { Driver } from '@/types/driver';
import { useDrivers } from '@/hooks/useDrivers';
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

interface DriversManagerProps {
  userRole: string;
}

export const DriversManager = ({ userRole }: DriversManagerProps) => {
  const { drivers, loading, addDriver, updateDriver, deleteDriver } =
    useDrivers();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Update restrictions based on role
  const canAdd = userRole === 'superadmin' || userRole === 'admin';
  const canEdit = userRole === 'superadmin';
  const canDelete = userRole === 'superadmin';

  const handleAddDriver = async (driverData: Driver): Promise<boolean> => {
    if (!canAdd) return false;
    const success = await addDriver(driverData);
    if (success) {
      setShowAddForm(false);
    }
    return success;
  };

  const handleEditDriver = (driver: Driver) => {
    if (!canEdit) return;
    setSelectedDriver(driver);
    setShowEditForm(true);
  };

  const handleUpdateDriver = async (driverData: Driver): Promise<boolean> => {
    if (!canEdit || !selectedDriver) return false;
    const success = await updateDriver(selectedDriver.id, driverData);
    if (success) {
      setShowEditForm(false);
      setSelectedDriver(null);
    }
    return success;
  };

  const handleDeleteDriver = (driverId: string) => {
    setPendingDeleteId(driverId);
    setShowDeleteModal(true);
  };

  const confirmDeleteDriver = async () => {
    if (pendingDeleteId) {
      await deleteDriver(pendingDeleteId);
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    }
  };

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm);

    const matchesStatus =
      filterStatus === 'all' || driver.status === filterStatus;

    const matchesRole = filterRole === 'all' || driver.role === filterRole;

    const isNotRootUser = driver.username !== 'root';

    return matchesSearch && matchesStatus && matchesRole && isNotRootUser;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='w-8 h-8 animate-spin' />
        <span className='ml-2'>Loading drivers...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>
            Drivers Management
          </h2>
          <p className='text-gray-600'>
            Manage driver profiles and track their performance
          </p>
        </div>
        {canAdd && (
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
                <UserPlus className='w-4 h-4 mr-2' />
                Add New Driver
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogDescription>
                  Create a new driver profile with all necessary details.
                </DialogDescription>
              </DialogHeader>
              <DriverForm
                onSubmit={handleAddDriver}
                onCancel={() => setShowAddForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <DriverStatsCards drivers={drivers} />

      {/* Search and Filters */}
      <DriverSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
      />

      {/* Drivers Grid */}
      {filteredDrivers.length === 0 ? (
        <DriverEmptyState />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              userRole={userRole}
              onEdit={canEdit ? handleEditDriver : () => {}}
              onDelete={canDelete ? handleDeleteDriver : () => {}}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Edit Driver Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update driver information and credentials.
            </DialogDescription>
          </DialogHeader>
          {selectedDriver && canEdit && (
            <DriverForm
              driver={selectedDriver}
              onSubmit={handleUpdateDriver}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedDriver(null);
              }}
              isEdit={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Driver Details Modal */}
      <DriverDetailsModal
        driver={selectedDriver}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDriver(null);
        }}
      />

      {/* DELETE DRIVER CONFIRM MODAL */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this driver? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteModal(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDriver}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
