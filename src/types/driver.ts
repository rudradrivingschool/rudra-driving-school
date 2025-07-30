
export interface Ride {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
  car?: string;
  notes?: string;
}

// Add role to Driver interface
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  joinDate: string;
  status: "active" | "inactive";
  totalRides: number;
  rides: Ride[];
  username: string;
  password: string;
  role: "admin" | "driver";
}
