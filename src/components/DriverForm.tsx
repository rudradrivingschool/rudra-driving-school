import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Driver } from '@/types/driver';

interface DriverFormProps {
  driver?: Driver;
  onSubmit: (driver: Driver) => Promise<boolean> | boolean;
  onCancel: () => void;
  isEdit?: boolean;
}

export const DriverForm = ({
  driver,
  onSubmit,
  onCancel,
  isEdit = false,
}: DriverFormProps) => {
  const [formData, setFormData] = useState<Driver>({
    id: driver?.id || '',
    name: driver?.name || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    licenseNumber: driver?.licenseNumber || '',
    joinDate: driver?.joinDate || new Date().toISOString().split('T')[0],
    status: driver?.status || 'active',
    totalRides: driver?.totalRides || 0,
    rides: driver?.rides || [],
    username: driver?.username || '',
    password: driver?.password || '',
    role: driver?.role || 'driver',
  });

  const handleInputChange = (field: keyof Driver, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.phone ||
      !formData.username ||
      !formData.password
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Full Name *</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder='Enter full name'
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='email'>Email *</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            required
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder='Enter email address'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='phone'>Phone *</Label>
          <Input
            id='phone'
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder='Enter phone number'
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='licenseNumber'>License Number</Label>
          <Input
            id='licenseNumber'
            value={formData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            placeholder='Enter license number'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='username'>Username *</Label>
          <Input
            id='username'
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder='Enter username'
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='password'>Password *</Label>
          <Input
            id='password'
            type='password'
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder='Enter password'
            required
            autoComplete='new-password'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='role'>Role</Label>
          <select
            id='role'
            value={formData.role}
            onChange={(e) =>
              handleInputChange('role', e.target.value as 'admin' | 'driver')
            }
            className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm'
          >
            <option value='driver'>Driver</option>
            <option value='admin'>Admin</option>
          </select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='joinDate'>Join Date</Label>
          <Input
            id='joinDate'
            type='date'
            value={formData.joinDate}
            onChange={(e) => handleInputChange('joinDate', e.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='status'>Status</Label>
          <select
            id='status'
            value={formData.status}
            onChange={(e) =>
              handleInputChange(
                'status',
                e.target.value as 'active' | 'inactive'
              )
            }
            className='w-full h-10 px-3 rounded-md border border-input bg-background text-sm'
          >
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>
      </div>

      <div className='flex justify-end space-x-4 pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type='submit'
          className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        >
          {isEdit ? 'Update Driver' : 'Add Driver'}
        </Button>
      </div>
    </form>
  );
};
