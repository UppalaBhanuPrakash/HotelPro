import { Injectable } from '@angular/core';
import { BehaviorSubject,Observable } from 'rxjs';
import { Room, Booking, Guest } from '../models/interfaces';
import { HttpClient } from '@angular/common/http';
import { AppUser } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private baseUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) {   this.getGuests();this.getRooms();this.getBookings();} 
    private roomsSubject = new BehaviorSubject<Room[]>([]);
      private guestsSubject = new BehaviorSubject<Guest[]>([]);
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);

  public rooms$ = this.roomsSubject.asObservable();
  public bookings$ = this.bookingsSubject.asObservable();
  public guests$ = this.guestsSubject.asObservable();
  

  getDashboardStats(): void {
  this.http.get<Room[]>(`${this.baseUrl}/rooms`).subscribe(rooms => {
    this.roomsSubject.next(rooms);
  });

  this.http.get<Booking[]>(`${this.baseUrl}/bookings`).subscribe(bookings => {
    const parsed = bookings.map(b => ({
      ...b,
      checkIn: new Date(b.checkIn),
      checkOut: new Date(b.checkOut)
    }));
    this.bookingsSubject.next(parsed);
  });
}

getAvailableRoomsCount(): number {
  return this.roomsSubject.value.filter(r => r.status === 'available').length;
}

getOccupiedRoomsCount(): number {
  return this.roomsSubject.value.filter(r => r.status === 'occupied').length;
}

getTotalBookingsCount(): number {
  return this.bookingsSubject.value.length;
}

getMonthlyRevenue(month: number, year: number): number {
  return this.bookingsSubject.value
    .filter(b => b.status === 'completed' && b.totalAmount && new Date(b.checkOut).getMonth() === month && new Date(b.checkOut).getFullYear() === year)
    .reduce((sum, b) => sum + b.totalAmount, 0);
}

//Get Rooms
getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/rooms`);
  }

  // ADD a room
  addRoom(room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.post<Room>(`${this.baseUrl}/rooms`, room);
  }

  // UPDATE a room
  updateRoom(id: string, room: Partial<Room>): Observable<Room> {
    return this.http.patch<Room>(`${this.baseUrl}/rooms/${id}`, room);
  }

  // DELETE a room
  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/rooms/${id}`);
  }


  getBookings(): void {
    this.http.get<Booking[]>(`${this.baseUrl}/bookings`).subscribe(bookings => {
      const parsed = bookings.map(b => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut)
      }));
      this.bookingsSubject.next(parsed);
    });
  }

  // bookings$ = this.bookingsSubject.asObservable();

  //  This method MUST exist
updateBooking(id: string, booking: Partial<Booking>): void {
  this.http.patch<Booking>(`${this.baseUrl}/bookings/${id}`, booking).subscribe(() => {
    // Update local bookings
    const updatedBookings = this.bookingsSubject.value.map(b =>
      b.id === id ? { ...b, ...booking } : b
    );
    this.bookingsSubject.next(updatedBookings);

    // Update room status if booking status changed
    if (booking.status && updatedBookings.find(b => b.id === id)) {
      let roomStatus: Room['status'];
      switch (booking.status) {
        case 'confirmed': roomStatus = 'occupied'; break;
        case 'pending': roomStatus = 'reserved'; break;
        case 'completed':
        case 'cancelled': roomStatus = 'available'; break;
        default: return;
      }

      const roomId = updatedBookings.find(b => b.id === id)?.roomId;
      if (roomId) {
        this.updateRoom(roomId, { status: roomStatus }).subscribe(updatedRoom => {
          const updatedRooms = this.roomsSubject.value.map(r =>
            r.id === updatedRoom.id ? updatedRoom : r
          );
          this.roomsSubject.next(updatedRooms);
        });
      }
    }
  });
}

  addBooking(booking: Omit<Booking, 'id'>): void {
  const newBooking: Booking = { ...booking, id: Date.now().toString() };

  this.http.post<Booking>(`${this.baseUrl}/bookings`, newBooking).subscribe(added => {
    // Update the bookingsSubject
    this.bookingsSubject.next([...this.bookingsSubject.value, {
      ...added,
      checkIn: new Date(added.checkIn),
      checkOut: new Date(added.checkOut)
    }]);

    // Determine room status
    let roomStatus: Room['status'] = 'available';
    if (added.status === 'confirmed') roomStatus = 'occupied';
    else if (added.status === 'pending') roomStatus = 'reserved';

    // Update the room status in backend
    this.updateRoom(added.roomId, { status: roomStatus }).subscribe(updatedRoom => {
      // Also update local roomsSubject so UI reflects the change
      const updatedRooms = this.roomsSubject.value.map(r =>
        r.id === updatedRoom.id ? updatedRoom : r
      );
      this.roomsSubject.next(updatedRooms);
    });
  });
}
  private updateRoomStatusFromBooking(roomId: string, bookingStatus: string): void {
    let roomStatus: Room['status'];
    
    switch (bookingStatus) {
      case 'confirmed':
        roomStatus = 'occupied';
        break;
      case 'pending':
        roomStatus = 'reserved';
        break;
      case 'completed':
      case 'cancelled':
        roomStatus = 'available';
        break;
      default:
        return; // Don't update room status for unknown booking status
    }
    
    this.updateRoom(roomId, { status: roomStatus });
  }

  // Guest methods
  getGuests(): void {
    this.http.get<Guest[]>(`${this.baseUrl}/guests`).subscribe(guests => {
      this.guestsSubject.next(guests);
    });
  }
addGuest(guest: Omit<Guest, 'id' | 'bookings'>): void {
  // Fetch all guests first
  this.http.get<Guest[]>(`${this.baseUrl}/guests`).subscribe({
    next: (guests) => {
      const maxId = guests.length > 0 ? Math.max(...guests.map(g => +g.id)) : 0;

      const newGuest: Guest = {
        ...guest,
        id: (maxId + 1).toString(),
        bookings: [],
        isVip: guest.isVip || false,
        loyaltyPoints: guest.loyaltyPoints || 0
      };

      // Save new guest
      this.http.post<Guest>(`${this.baseUrl}/guests`, newGuest).subscribe(() => {
        this.getGuests(); // refresh list after adding
      });
    },
    error: (err) => {
      console.error('Error fetching guests:', err);
    }
  });
}


updateGuest(id: string, updatedGuest: Partial<Guest>): void {
  this.http.patch<Guest>(`${this.baseUrl}/guests/${id}`, updatedGuest).subscribe({
    next: (savedGuest) => {
      const current = this.guestsSubject.getValue();
      const newList = current.map(g =>
        g.id === id ? { ...g, ...savedGuest } : g
      );
      this.guestsSubject.next(newList); //  UI updates automatically
    },
    error: (err) => {
      console.error(`Error updating guest with id ${id}:`, err);
    }
  });
}
deleteGuest(id: string): void {
  this.http.delete<void>(`${this.baseUrl}/guests/${id}`).subscribe(() => {
    this.getGuests(); // refresh list after delete
  });
}


 //  Fetch all users

private userManagementUrl = `${this.baseUrl}/UserManagement`;



// Fetch all UserManagement users
getUserManagement(): Observable<AppUser[]> {
  return this.http.get<AppUser[]>(this.userManagementUrl);
}

// Fetch a single UserManagement user by ID
getUserManagementById(id: string): Observable<AppUser> {
  return this.http.get<AppUser>(`${this.userManagementUrl}/${id}`);
}

// Add a new user to UserManagement
addUserManagement(user: Omit<AppUser, 'id'>): Observable<AppUser> {
  return this.http.post<AppUser>(this.userManagementUrl, user);
}

// Update an existing UserManagement user
updateUserManagement(id: string, updated: Partial<AppUser>): Observable<AppUser> {
  return this.http.patch<AppUser>(`${this.userManagementUrl}/${id}`, updated);
}

// Delete a UserManagement user
deleteUserManagement(id: string): Observable<void> {
  return this.http.delete<void>(`${this.userManagementUrl}/${id}`);
}

}
