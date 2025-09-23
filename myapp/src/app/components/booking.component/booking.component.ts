// import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { Booking, Room, Guest } from '../../models/interfaces';
import { ChangeDetectorRef } from '@angular/core';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
declare var bootstrap: any; 
@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingsComponent implements OnInit {
  @ViewChild('bookingToast') bookingToastRef!: ElementRef;
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
  today: string = new Date().toISOString().split('T')[0];
minCheckoutDate: string = this.today;

 
constructor(private hotelService: HotelService, private cdr: ChangeDetectorRef) {}

 ngOnInit() {
 this.hotelService.getBookings();
  this.hotelService.getGuests();
  this.hotelService.getRooms().subscribe({
    next: (rooms: Room[]) => this.hotelService['roomsSubject'].next(rooms),
    error: (err: any) => console.error(err)
  });

  //  subscribe to reactive streams
  this.hotelService.bookings$.subscribe(bookings => {
    const today = new Date();

    bookings.forEach(b => {
      if (
        b.status !== 'completed' &&
        b.checkOut instanceof Date &&
        b.checkOut < today
      ) {
        this.hotelService.updateBooking(b.id, { status: 'completed' });
      }
    });

    this.bookings = [...bookings].sort(
      (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
    );
  });

  //  these always reflect updates instantly
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
  const selectedId = this.currentBooking.roomId; // this is a string
  return this.rooms.filter(r => r.status === 'available' || r.id.toString() === selectedId);
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
  // Load the selected booking into currentBooking
  this.currentBooking = { ...booking };

  // Set check-in and check-out dates for date inputs
  this.checkInDate = booking.checkIn.toISOString().split('T')[0];
  this.checkOutDate = booking.checkOut.toISOString().split('T')[0];

  // Show the Edit modal
  this.showEditModal = true;

  // Recalculate total and remaining amounts
  this.calculateTotal(); // Calculates totalAmount based on room and nights
  this.onAdvanceChange(); // Updates remainingAmount based on advancePaid

  // Ensure the modal picks up changes immediately
  this.cdr.detectChanges();
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
    this.currentBooking.remainingAmount = (total - (this.currentBooking.advancePaid || 0));
    this.currentBooking.checkIn = checkIn;
    this.currentBooking.checkOut = checkOut;

    
    this.cdr.detectChanges();
  }
}
checkoutError: boolean = false;
onCheckInChange() {
  this.calculateTotal();

 if (this.checkInDate) {
    const checkIn = new Date(this.checkInDate);
    const nextDay = new Date(checkIn);
    nextDay.setDate(checkIn.getDate() + 1);

    this.minCheckoutDate = nextDay.toISOString().split('T')[0];
  }
    this.validateDates();
}


  onCheckOutChange() {
    this.calculateTotal();
  this.validateDates();

  }
  validateDates() {
  if (this.checkInDate && this.checkOutDate) {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);

    this.checkoutError = checkOut <= checkIn; // error if same day or before
  } else {
    this.checkoutError = false;
  }
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
        this.showBookingToast(); // Show success toast
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
        this.showBookingToast(); // Show success toast
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
   showBookingToast() {
    if (this.bookingToastRef) {
      const toastEl = this.bookingToastRef.nativeElement;

      // Create Bootstrap toast instance
      const toast = new bootstrap.Toast(toastEl, { 
        delay: 3000,  // Auto-hide after 3 seconds
        autohide: true
      });

      toast.show(); // Show the toast
    }
  }

  getStatusAfterBooking(): string {
    if (this.currentBooking.status === 'confirmed') return 'occupied';
    else if (this.currentBooking.status === 'pending') return 'reserved';
    return 'available';
  }
}
