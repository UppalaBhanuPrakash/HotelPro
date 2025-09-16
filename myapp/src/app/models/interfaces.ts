export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'guest';
  phone?: string;
}

export type ServiceType = 'housekeeping' | 'maintenance' | 'room-service' | 'concierge' | 'laundry';
export type ServiceStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  price: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description: string;
  amenities: string[];
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  guestName: string;
  roomNumber: string;
  advancePaid?: number; 
  remainingAmount?: number; 
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  idNumber: string;
  isVip: boolean;
  vipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  bookings: Booking[];
}


export interface Signup {
  id?: number;                 // Optional because JSON Server generates it
  name: string;
  email: string;
  password?: string;           // Optional so hardcoded users don’t need it
  role?: 'admin' | 'staff' | 'guest';
}

export interface AppUser extends User {
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}


export interface ServiceRequest {
  id: string;
  roomNumber: string;
  type: ServiceType;
  description: string;
  status: ServiceStatus;
  priority: Priority;
  requestedAt: Date;
  assignedTo?: string;
  completedAt?: Date;
}
