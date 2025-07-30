export interface Ride {
  id: string;
  date: Date;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
  driverName: string;
  car?: string; // <-- add car property
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  sex: string;
  licenseType: string;
  licenseNumber: string;
  fees: number;
  advanceAmount: number;
  duration: string;
  licenseStatus: {
    learning: string;
    driving: string;
  };
  rides: {
    completed: number;
    remaining: number;
    total: number;
  };
  startDate: Date;
  endDate: Date;
  status: string;
  additionalNotes: string;
  rideHistory: Ride[];
  ridesCompleted: number;  // <======= NEW FIELD
  totalRides: number;      // <======= NEW FIELD
}

export type SortField = 'name' | 'startDate' | 'fees' | 'status' | 'progress';
export type SortDirection = 'asc' | 'desc';

export interface ClientFormData {
  name: string;
  contact: string;
  email: string;
  sex: string;
  licenseType: string;
  licenseNumber: string;
  fees: number;
  advanceAmount: number;
  duration: string;
  learningLicense: string;
  drivingLicense: string;
  status: string;
  startDate: Date;
  additionalNotes: string;
  packageRides: number; // 8/15/30 etc - used to select totalRides
}
