import { toast } from "sonner";
import { ClientFormData } from "@/types/client";

export const validateClientForm = (formData: ClientFormData, isEdit: boolean = false): boolean => {
  const requiredFields: string[] = [
    'name', 'contact', 'sex', 'licenseType', 'duration'
  ];

  // Only require learningLicense and drivingLicense if NOT NA
  if (formData.licenseType !== "NA") {
    requiredFields.push('learningLicense', 'drivingLicense');
    // licenseNumber is OPTIONAL everywhere now!
  }

  // Add status for edit
  if (isEdit) {
    requiredFields.push('status');
  }

  const missingFields = requiredFields.filter(field => !formData[field as keyof ClientFormData] || formData[field as keyof ClientFormData] === '');

  if (missingFields.length > 0) {
    toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return false;
  }

  if (formData.fees <= 0) {
    toast.error('Fees must be greater than 0');
    return false;
  }

  if (formData.advanceAmount < 0) {
    toast.error('Advance amount cannot be negative');
    return false;
  }

  if (formData.advanceAmount > formData.fees) {
    toast.error('Advance amount cannot be greater than total fees');
    return false;
  }

  return true;
};
