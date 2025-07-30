import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClientFormData } from '@/types/client';

interface ClientFormProps {
  formData: ClientFormData & { customLicenseType?: string };
  setFormData: React.Dispatch<
    React.SetStateAction<ClientFormData & { customLicenseType?: string }>
  >;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export const ClientForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
}: ClientFormProps) => {
  const licenseTypeOptions = [
    { value: 'MCWOG', label: 'MCWOG (M.C W/o Gear)' },
    { value: 'MCWG', label: 'MCWG (M.C With Gear)' },
    { value: 'LMV', label: 'LMV (LMV-NT-Car)' },
    { value: 'LMV-TR', label: 'LMV-TR (LMV-Transport)' },
    { value: 'TRANS', label: 'TRANS (Transport)' },
    { value: '3W-TR', label: '3W-TR (LMV-3 Wheeler TR)' },
    { value: 'Other', label: 'Other' },
    { value: 'NA', label: 'NA (Only Training)' },
  ];

  // Helper: Whether to show license-related fields (should be false for NA)
  const showLicenseFields = formData.licenseType !== 'NA';
  // Helper: Whether to show custom license type input
  const isOther = formData.licenseType === 'Other';

  // Track previous licenseType for field reset
  const prevLicenseType = React.useRef<string>(formData.licenseType);

  React.useEffect(() => {
    // Clear license-related fields when switching TO "NA"
    if (formData.licenseType === 'NA' && prevLicenseType.current !== 'NA') {
      setFormData((fd) => ({
        ...fd,
        licenseNumber: '',
        learningLicense: '',
        drivingLicense: '',
        customLicenseType: '',
      }));
    }
    prevLicenseType.current = formData.licenseType;
  }, [formData.licenseType, setFormData]);

  // Keep licenseNumber and customLicenseType completely independent
  const handleLicenseTypeChange = (value: string) => {
    setFormData((fd) => ({
      ...fd,
      licenseType: value,
      // Only reset customLicenseType when not "Other"
      customLicenseType: value === 'Other' ? fd.customLicenseType ?? '' : '',
    }));
  };

  // On submit, just call onSubmit since we've always kept both fields independent
  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 py-4'>
        {/* Row 1 */}
        <div className='space-y-2'>
          <Label htmlFor='name'>Full Name *</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder='Enter full name'
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='contact'>Contact Number *</Label>
          <Input
            id='contact'
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
            placeholder='+91 XXXXX XXXXX'
            required
          />
        </div>
        {/* Row 2 */}
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder='email@example.com'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='sex'>Gender *</Label>
          <Select
            value={formData.sex}
            onValueChange={(value) => setFormData({ ...formData, sex: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder='Select gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Male'>Male</SelectItem>
              <SelectItem value='Female'>Female</SelectItem>
              <SelectItem value='Other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* License Type */}
        <div className='space-y-2'>
          <Label htmlFor='licenseType'>License Type *</Label>
          <Select
            value={formData.licenseType}
            onValueChange={handleLicenseTypeChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder='Select license type' />
            </SelectTrigger>
            <SelectContent>
              {licenseTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* License Number (ALWAYS rendered, not affected by Other) */}
        <div className='space-y-2'>
          <Label htmlFor='licenseNumber'>License Number</Label>
          <Input
            id='licenseNumber'
            value={formData.licenseNumber}
            onChange={(e) =>
              setFormData({ ...formData, licenseNumber: e.target.value })
            }
            placeholder='Enter license number (optional)'
          />
        </div>
        {/* Specify License Type (additional field when Other is selected) */}
        {showLicenseFields && isOther && (
          <div className='space-y-2'>
            <Label htmlFor='customLicenseType'>Specify License Type *</Label>
            <Input
              id='customLicenseType'
              value={formData.customLicenseType ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, customLicenseType: e.target.value })
              }
              placeholder='Enter other license type'
            />
          </div>
        )}
        {/* Learning License */}
        {showLicenseFields && (
          <div className='space-y-2'>
            <Label htmlFor='learning'>Learning License *</Label>
            <Select
              value={formData.learningLicense}
              onValueChange={(value) =>
                setFormData({ ...formData, learningLicense: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='Select learning license status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Not Applied'>Not Applied</SelectItem>
                <SelectItem value='Applied'>Applied</SelectItem>
                <SelectItem value='Received'>Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Driving License */}
        {showLicenseFields && (
          <div className='space-y-2'>
            <Label htmlFor='driving'>Driving License *</Label>
            <Select
              value={formData.drivingLicense}
              onValueChange={(value) =>
                setFormData({ ...formData, drivingLicense: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='Select driving license status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Pending'>Pending</SelectItem>
                <SelectItem value='Applied'>Applied</SelectItem>
                <SelectItem value='Received'>Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Fees */}
        <div className='space-y-2'>
          <Label htmlFor='fees'>Fees (₹) *</Label>
          <Input
            id='fees'
            type='number'
            value={formData.fees}
            onChange={(e) =>
              setFormData({ ...formData, fees: parseInt(e.target.value) || 0 })
            }
            placeholder='15000'
            required
          />
        </div>
        {/* Advance Amount */}

        <div className='space-y-2'>
          <Label htmlFor='advanceAmount'>Advance Amount (₹) *</Label>
          <Input
            id='advanceAmount'
            type='number'
            value={formData.advanceAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                advanceAmount: parseInt(e.target.value) || 0,
              })
            }
            placeholder='5000'
            required
            disabled={isEdit}
          />
        </div>
        {/* Package */}
        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='duration'>Package *</Label>
          <Select
            value={formData.duration}
            onValueChange={(value) =>
              setFormData({ ...formData, duration: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder='Select package' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='8 rides/month'>
                8 Rides/Month (16 km/day)
              </SelectItem>
              <SelectItem value='15 rides/month'>
                15 Rides/Month (8 km/day)
              </SelectItem>
              <SelectItem value='30 rides/month'>
                30 Rides/Month (4 km/day)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Status For Edit */}
        {isEdit && (
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='status'>Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Active'>Active</SelectItem>
                <SelectItem value='Completed'>Completed</SelectItem>
                <SelectItem value='Terminated'>Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Additional Notes */}
        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='additionalNotes'>Additional Notes</Label>
          <Textarea
            id='additionalNotes'
            value={formData.additionalNotes}
            onChange={(e) =>
              setFormData({ ...formData, additionalNotes: e.target.value })
            }
            placeholder='Any additional notes or special requirements...'
            rows={3}
          />
        </div>
      </div>

      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {isEdit ? 'Update Client' : 'Add Client'}
        </Button>
      </div>
    </div>
  );
};
