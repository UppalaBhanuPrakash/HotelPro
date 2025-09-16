import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { Booking, Room, Guest } from '../../models/interfaces';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  rooms: Room[] = [];
  guests: Guest[] = [];
  showAddModal = false;
  showEditModal = false;

  currentBooking: Partial<Booking> = {
    ...this.getEmptyBooking(),
    advancePaid: 0,
    remainingAmount: 0
  };

  checkInDate = '';
  checkOutDate = '';

  constructor(private hotelService: HotelService) {}

 ngOnInit() {
  this.hotelService.getBookings();
  this.hotelService.getGuests();
  this.hotelService.getRooms().subscribe(rooms => this.rooms = rooms);

  this.hotelService.bookings$.subscribe(bookings => {
    const today = new Date();

    // Loop over all bookings
    bookings.forEach(b => {
      if (
        b.status !== 'completed' &&   // don’t override already completed
        b.checkOut instanceof Date && // ensure it's a Date
        b.checkOut < today            // past checkout
      ) {
        // Auto-update status
        this.hotelService.updateBooking(b.id, { status: 'completed' });
        console.log(`Booking for ${b.guestName} auto-updated to completed`);
      }
    });

    // Sort for display
    this.bookings = [...bookings].sort(
      (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
    );
  });

  this.hotelService.rooms$.subscribe(rooms => this.rooms = rooms);
  this.hotelService.guests$.subscribe(guests => this.guests = guests);
}
  getEmptyBooking(): Partial<Booking> {
    return {
      guestId: '',
      roomId: '',
      status: 'pending',
      totalAmount: 0,
      guestName: '',
      roomNumber: '',
      advancePaid: 0,
      remainingAmount: 0
    };
  }

  isBookingValid(): boolean {
    if (!this.currentBooking.guestId) {
      alert('Please select a guest.');
      return false;
    }
    if (!this.currentBooking.roomId) {
      alert('Please select a room.');
      return false;
    }
    if (!this.checkInDate || !this.checkOutDate) {
      alert('Please select both check-in and check-out dates.');
      return false;
    }

    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);

    if (checkOut < checkIn) {
      alert('Check-out date cannot be earlier than check-in date.');
      return false;
    }

    if ((this.currentBooking.advancePaid || 0) > (this.currentBooking.totalAmount || 0)) {
      alert('Advance cannot be more than total amount.');
      return false;
    }

    return true;
  }

  get displayNights(): number {
    if (this.checkInDate && this.checkOutDate) {
      return this.calculateNights(new Date(this.checkInDate), new Date(this.checkOutDate));
    }
    return 0;
  }

  get availableRooms(): Room[] {
    return this.rooms.filter(r => r.status === 'available' || r.id === this.currentBooking.roomId);
  }

  get confirmedCount(): number {
    return this.bookings.filter(b => b.status === 'confirmed').length;
  }

  get pendingCount(): number {
    return this.bookings.filter(b => b.status === 'pending').length;
  }

  get completedCount(): number {
    return this.bookings.filter(b => b.status === 'completed').length;
  }

  get totalRevenue(): number {
    return this.bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }

  calculateNights(checkIn: Date, checkOut: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((checkOut.getTime() - checkIn.getTime()) / oneDay));
  }

  editBooking(booking: Booking) {
    this.currentBooking = { ...booking };
    this.checkInDate = booking.checkIn.toISOString().split('T')[0];
    this.checkOutDate = booking.checkOut.toISOString().split('T')[0];
    this.showEditModal = true;
    this.calculateTotal();
  }

  updateBookingStatus(booking: Booking) {
    const nextStatus = this.getNextStatus(booking.status);
    this.hotelService.updateBooking(booking.id, { status: nextStatus });
    console.log(`Booking for ${booking.guestName} updated to ${nextStatus}`);
  }

  getNextStatus(currentStatus: string): 'confirmed' | 'pending' | 'cancelled' | 'completed' {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'completed';
      case 'completed': return 'cancelled';
      case 'cancelled': return 'pending';
      default: return 'pending';
    }
  }

  onGuestChange() {
    const selectedGuest = this.guests.find(g => g.id === this.currentBooking.guestId);
    if (selectedGuest) this.currentBooking.guestName = selectedGuest.name;
  }

  onRoomChange() {
    const selectedRoom = this.rooms.find(r => r.id === this.currentBooking.roomId);
    if (selectedRoom) this.currentBooking.roomNumber = selectedRoom.number;
    this.calculateTotal();
  }

  getRoomPrice(): number {
    const room = this.rooms.find(r => r.id === this.currentBooking.roomId);
    return room ? room.price : 0;
  }
calculateTotal() {
  if (this.checkInDate && this.checkOutDate && this.currentBooking.roomId) {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const nights = this.calculateNights(checkIn, checkOut);
    const roomPrice = this.getRoomPrice();
    const total = nights * roomPrice;

    this.currentBooking.totalAmount = total;
    // Remaining amount = total - advancePaid
    this.currentBooking.remainingAmount = (total - (this.currentBooking.advancePaid || 0));
    this.currentBooking.checkIn = checkIn;
    this.currentBooking.checkOut = checkOut;
  }
}

  onCheckInChange() {
    this.calculateTotal();
  }

  onCheckOutChange() {
    this.calculateTotal();
  }

 onAdvanceChange() {
  if (this.currentBooking.status === 'completed') {
    this.currentBooking.remainingAmount = 0;
  } else {
    this.currentBooking.remainingAmount =
      (this.currentBooking.totalAmount || 0) - (this.currentBooking.advancePaid || 0);
  }
}

  getRemainingAmount(booking: Booking): number {
    if (booking.status === 'completed') return 0;
    return (booking.totalAmount || 0) - (booking.advancePaid || 0);
  }
saveBooking() {
  if (!this.isBookingValid()) return;

  this.calculateTotal();
  this.onAdvanceChange();

  if (this.showAddModal) {
    this.hotelService.addBooking(this.currentBooking as Omit<Booking, 'id'>);
    console.log(`New booking created for ${this.currentBooking.guestName}`);
  } else if (this.showEditModal && this.currentBooking.id) {
    //  Check if booking was auto-completed but new checkout is in the future
    const now = new Date();
    if (
      this.currentBooking.status === 'completed' &&
      this.currentBooking.checkOut &&
      this.currentBooking.checkOut > now
    ) {
      this.currentBooking.status = 'confirmed';
    }

    this.hotelService.updateBooking(this.currentBooking.id, this.currentBooking);
    console.log(`Booking updated for ${this.currentBooking.guestName}`);
  }

  this.closeModal();
}


  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.currentBooking = this.getEmptyBooking();
    this.checkInDate = '';
    this.checkOutDate = '';
  }

  getSelectedGuestName(): string {
    const guest = this.guests.find(g => g.id === this.currentBooking.guestId);
    return guest ? guest.name : 'Select Guest';
  }

  getSelectedRoomInfo(): string {
    const room = this.rooms.find(r => r.id === this.currentBooking.roomId);
    return room ? `${room.number} - ${room.type}` : 'Select Room';
  }

  getStatusAfterBooking(): string {
    if (this.currentBooking.status === 'confirmed') return 'occupied';
    else if (this.currentBooking.status === 'pending') return 'reserved';
    return 'available';
  }
}
