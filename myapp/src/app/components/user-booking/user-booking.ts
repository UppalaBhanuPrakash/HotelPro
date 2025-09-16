import { Component, OnInit } from '@angular/core';
import { HotelService } from '../../services/hotel.service';
import { Room, Booking } from '../../models/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-booking.html',
  styleUrls: ['./user-booking.css']
})
export class UserBookingComponent implements OnInit {
  availableRooms: Room[] = [];
  showBookingForm = false;
  selectedRoom!: Room;

  // Booking form fields
  guestName: string = '';
  governmentId: string = '';
  checkInDate: string = '';
  checkOutDate: string = '';
  totalCost: number = 0;

  bookingMessage: string = '';

  constructor(private hotelService: HotelService) {}

  ngOnInit(): void {
    this.hotelService.getRooms().toPromise().then(rooms => {
      if (rooms) {
        this.availableRooms = rooms.filter(r => r.status === 'available');
      }
    }).catch(err => console.error('Error fetching rooms:', err));
  }

  openBookingForm(room: Room) {
    this.selectedRoom = room;
    this.showBookingForm = true;
    this.checkInDate = '';
    this.checkOutDate = '';
    this.guestName = '';
    this.governmentId = '';
    this.totalCost = 0;
  }

  calculateTotal() {
    if (this.checkInDate && this.checkOutDate && this.selectedRoom) {
      const checkIn = new Date(this.checkInDate);
      const checkOut = new Date(this.checkOutDate);
      const nights = Math.round(Math.abs((checkOut.getTime() - checkIn.getTime()) / (1000*60*60*24)));
      this.totalCost = nights * this.selectedRoom.price;
    }
  }

  payNow() {
    if (!this.guestName || !this.governmentId || !this.checkInDate || !this.checkOutDate) {
      alert('Please fill all fields');
      return;
    }

    const newBooking: Omit<Booking, 'id'> = {
      roomId: this.selectedRoom.id,
      roomNumber: this.selectedRoom.number,
      guestId: this.governmentId,
      guestName: this.guestName,
      checkIn: new Date(this.checkInDate),
      checkOut: new Date(this.checkOutDate),
      status: 'pending',
      totalAmount: this.totalCost,
      advancePaid: 0,
      remainingAmount: this.totalCost
    };

    this.hotelService.addBooking(newBooking);
    this.bookingMessage = `Room "${this.selectedRoom.number}" booked successfully!`;
    this.showBookingForm = false;

    // Remove booked room from availableRooms
    this.availableRooms = this.availableRooms.filter(r => r.id !== this.selectedRoom.id);
  }
}
