import { Component, OnInit, OnDestroy } from '@angular/core';
import { HotelService } from '../../services/hotel.service';
import { Room, Booking } from '../../models/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SortPipePipe } from '../../pipes/sort.pipe-pipe';
@Component({
  selector: 'app-user-booking',
  standalone: true,
  imports: [CommonModule, FormsModule,SortPipePipe],
  templateUrl: './user-booking.html',
  styleUrls: ['./user-booking.css']
})
export class UserBookingComponent implements OnInit, OnDestroy {

  allRooms: Room[] = [];
  allBookings: Booking[] = [];

  showBookingForm = false;
  selectedRoom!: Room;

  guestName = '';
  governmentId = '';
  checkInDate = '';
  checkOutDate = '';
  totalCost = 0;

  guestNameError = '';
  governmentIdError = '';
  idProofError = '';
  checkInError = '';
  checkOutError = '';
  dateError = '';

  idProofFile: File | null = null;
  idProofPreview: string | null = null;
  isImageFile = false;

  showToast = false;
  toastMessage = '';

  private subscriptions: Subscription[] = [];

  constructor(private hotelService: HotelService) {}

  ngOnInit(): void {
    // Subscribe to rooms and bookings
    const roomSub = this.hotelService.rooms$.subscribe(rooms => this.allRooms = rooms);
    const bookingSub = this.hotelService.bookings$.subscribe(bookings => this.allBookings = bookings);
    this.subscriptions.push(roomSub, bookingSub);

    // Fetch data from service
    this.hotelService.getRooms();
    this.hotelService.getBookings();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getBookedDates(room: Room) {
    return this.allBookings
      .filter(b => b.roomId === room.id)
      .map(b => ({ checkIn: new Date(b.checkIn), checkOut: new Date(b.checkOut) }));
  }

  openBookingForm(room: Room) {
    this.selectedRoom = room;
    this.showBookingForm = true;

    this.guestName = '';
    this.governmentId = '';
    this.checkInDate = '';
    this.checkOutDate = '';
    this.totalCost = 0;

    this.guestNameError = '';
    this.governmentIdError = '';
    this.idProofError = '';
    this.checkInError = '';
    this.checkOutError = '';
    this.dateError = '';

    this.idProofFile = null;
    this.idProofPreview = null;
    this.isImageFile = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.idProofFile = input.files[0];
      this.isImageFile = this.idProofFile.type.startsWith('image/');
      if (this.isImageFile) {
        const reader = new FileReader();
        reader.onload = () => this.idProofPreview = reader.result as string;
        reader.readAsDataURL(this.idProofFile);
      } else {
        this.idProofPreview = null;
      }
    }
    this.validateIdProof();
  }

  isDateBooked(room: Room, date: string): boolean {
    const d = new Date(date);
    return this.allBookings.some(b =>
      b.roomId === room.id &&
      d >= new Date(b.checkIn) &&
      d < new Date(b.checkOut)
    );
  }

  onCheckInChange() {
    if (this.isDateBooked(this.selectedRoom, this.checkInDate)) {
      this.checkInError = 'Selected check-in date is already booked.';
      this.checkInDate = '';
    } else {
      this.checkInError = '';
      this.calculateTotal();
    }
  }

  onCheckOutChange() {
    if (this.isDateBooked(this.selectedRoom, this.checkOutDate)) {
      this.checkOutError = 'Selected check-out date is already booked.';
      this.checkOutDate = '';
    } else {
      this.checkOutError = '';
      this.calculateTotal();
    }
  }

  calculateTotal() {
    if (this.checkInDate && this.checkOutDate && this.selectedRoom) {
      const checkIn = new Date(this.checkInDate);
      const checkOut = new Date(this.checkOutDate);

      if (checkIn >= checkOut) {
        this.dateError = "Check-Out date must be after Check-In date.";
        this.totalCost = 0;
        return;
      }

      const overlap = this.allBookings.some(b =>
        b.roomId === this.selectedRoom.id &&
        !(checkOut <= new Date(b.checkIn) || checkIn >= new Date(b.checkOut))
      );

      if (overlap) {
        this.dateError = "Selected dates overlap with an existing booking.";
        this.totalCost = 0;
        return;
      }

      this.dateError = '';
      const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000*60*60*24));
      this.totalCost = nights * this.selectedRoom.price;
    }
  }

  // Validation
  validateGuestName() {
    if (!this.guestName) this.guestNameError = 'Guest name is required.';
    else if (this.guestName.trim().length < 3) this.guestNameError = 'At least 3 characters required.';
    else this.guestNameError = '';
  }

  validateGovernmentId() {
    this.governmentIdError = this.governmentId ? '' : 'Government ID is required.';
  }

  validateIdProof() {
    this.idProofError = this.idProofFile ? '' : 'ID proof is required.';
  }

  payNow() {
    this.validateGuestName();
    this.validateGovernmentId();
    this.validateIdProof();

    if (this.guestNameError || this.governmentIdError || this.idProofError || this.checkInError || this.checkOutError || this.dateError) return;

    const reader = new FileReader();
    reader.onload = () => {
      const idProofBase64 = reader.result as string;

      const newBooking: Omit<Booking, 'id'> = {
        roomId: this.selectedRoom.id,
        roomNumber: this.selectedRoom.number,
        guestId: this.governmentId,
        guestName: this.guestName,
        checkIn: new Date(this.checkInDate),
        checkOut: new Date(this.checkOutDate),
        status: 'confirmed',
        totalAmount: this.totalCost,
        advancePaid: this.totalCost,
        remainingAmount: 0,
        idProof: idProofBase64
      };

      this.hotelService.addBooking(newBooking);
      this.showBookingForm = false;
      this.showToastMessage(`Room ${this.selectedRoom.number} booked successfully!`);
    };

    if (this.idProofFile) reader.readAsDataURL(this.idProofFile);
  }

  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.toastMessage = '';
    }, 3000);
  }
}
