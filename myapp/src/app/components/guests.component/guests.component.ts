import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { Guest, Booking } from '../../models/interfaces';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./guests.component.html' ,
  styleUrl:'./guests.component.css' 
})
export class GuestsComponent implements OnInit {
  guests: Guest[] = [];
  bookings: Booking[] = [];
  filteredGuests: Guest[] = [];
  searchTerm = '';
  showAddModal = false;
  showEditModal = false;
  showDetailsModal = false;
  currentGuest: Partial<Guest> = this.getEmptyGuest();
  selectedGuest: Guest | null = null;
  selectedFile: File | null = null;

onFileSelected(event: any) {
  const file: File | null = event.target.files?.[0] ?? null;
  if (!file) return;

  this.selectedFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    this.currentGuest.idProofPath = reader.result as string;
    console.log('ID Proof Base64:', this.currentGuest.idProofPath);
  };
  reader.readAsDataURL(file); 
}

  get activeGuestsCount(): number {
    return this.guests.filter(guest =>
      this.bookings.some(booking =>
        booking.guestId === guest.id &&
        (booking.status === 'confirmed' || booking.status === 'pending')
      )
    ).length;
  }

  get vipGuestsCount(): number {
    return this.guests.filter(guest => guest.isVip).length;
  }

  get averageSpending(): number {
    const totalSpending = this.guests.reduce((sum, guest) =>
      sum + this.getGuestTotalSpent(guest.id), 0
    );
    return this.guests.length > 0 ? totalSpending / this.guests.length : 0;
  }

  constructor(private hotelService: HotelService) {}

  ngOnInit() {
  // this.hotelService.getGuests();


  this.hotelService.guests$.subscribe(guests => {
    this.guests = guests;
    this.filterGuests();
  });

  this.hotelService.bookings$.subscribe(bookings => {
    this.bookings = bookings;
  });;
  }
saveGuest() {
  if (this.showAddModal) {
    this.hotelService.addGuest({
      ...this.currentGuest,
      idProofPath: this.currentGuest.idProofPath || ''
    } as Omit<Guest, 'id' | 'bookings'>);
  } else if (this.showEditModal && this.currentGuest.id) {
    this.hotelService.updateGuest(this.currentGuest.id, {
      ...this.currentGuest,
      idProofPath: this.currentGuest.idProofPath || ''
    });
  }
  this.closeModal();
}

  deleteGuest(guestId: string) {
    const hasActiveBookings = this.bookings.some(booking =>
      booking.guestId === guestId &&
      (booking.status === 'confirmed' || booking.status === 'pending')
    );

    if (hasActiveBookings) {
      alert('Cannot delete guest with active bookings.');
      return;
    }

    if (confirm('Are you sure you want to delete this guest?')) {
      this.hotelService.deleteGuest(guestId);
    }
  }

  getEmptyGuest(): Partial<Guest> {
    return {
      name: '',
      email: '',
      phone: '',
      address: '',
      idNumber: '',
      bookings: []
    };
  }

  filterGuests() {
    if (!this.searchTerm) {
      this.filteredGuests = [...this.guests];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredGuests = this.guests.filter(guest =>
        guest.name.toLowerCase().includes(term) ||
        guest.email.toLowerCase().includes(term) ||
        guest.phone.includes(term)
      );
    }
  }

  getGuestBookings(guestId: string): Booking[] {
    return this.bookings.filter(booking => booking.guestId === guestId);
  }

  getGuestTotalSpent(guestId: string): number {
    return this.getGuestBookings(guestId)
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
  }

getGuestStatus(guestId: string): string {
  const guest = this.guests.find(g => g.id === guestId);
  if (!guest) return 'Unknown';

  const totalSpent = this.getGuestTotalSpent(guestId);

  if (totalSpent > 1000 && !guest.isVip) {
    const updatedGuest: Partial<Guest> = {
      isVip: true,
      vipLevel: guest.vipLevel || 'bronze',
      loyaltyPoints: guest.loyaltyPoints || 100
    };
    this.hotelService.updateGuest(guest.id, updatedGuest);
  }

  const guestBookings = this.getGuestBookings(guestId);
  const hasActive = guestBookings.some(b =>
    b.status === 'confirmed' || b.status === 'pending'
  );

  if (hasActive) return 'Active';
  if (guest.isVip) return 'VIP';
  if (totalSpent > 0) return 'Regular';
  return 'New';
}

  editGuest(guest: Guest) {
    this.currentGuest = { ...guest };
    this.showEditModal = true;
  }

  viewGuestDetails(guest: Guest) {
    this.selectedGuest = guest;
    this.showDetailsModal = true;
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.currentGuest = this.getEmptyGuest();
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedGuest = null;
  }

  getGuestInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }
toggleVipStatus(guest: Guest) {
  const updatedGuest: Partial<Guest> = {
    isVip: !guest.isVip,
    vipLevel: !guest.isVip ? 'bronze' : guest.vipLevel,
    loyaltyPoints: !guest.isVip ? 100 : guest.loyaltyPoints
  };

  this.hotelService.updateGuest(guest.id, updatedGuest);
}

  onVipToggle() {
    if (this.currentGuest.isVip && !this.currentGuest.vipLevel) {
      this.currentGuest.vipLevel = 'bronze';
      this.currentGuest.loyaltyPoints = this.currentGuest.loyaltyPoints || 100;
    }
  }
}