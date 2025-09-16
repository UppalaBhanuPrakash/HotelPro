import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { Room, Booking } from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  rooms: Room[] = [];
  recentBookings: Booking[] = [];
  currentUser: any = null;

  availableRooms = 0;
  occupiedRooms = 0;
  totalBookings = 0;
  totalRevenue = 0;

  constructor(
    private hotelService: HotelService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    //Trigger backend stats fetch
    this.hotelService.getDashboardStats();

    //Subscribe to rooms
    this.hotelService.rooms$.subscribe(rooms => {
      this.rooms = [...rooms].slice(0, 3); // only take first 3
      this.availableRooms = this.hotelService.getAvailableRoomsCount();
      this.occupiedRooms = this.hotelService.getOccupiedRoomsCount();
    });

    //Subscribe to bookings (sorted by recent check-in)
    this.hotelService.bookings$.subscribe(bookings => {
      this.recentBookings = [...bookings]
        .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()) // latest first
        .slice(0, 3); // take only 3

      this.totalBookings = this.hotelService.getTotalBookingsCount();

      //Calculate monthly revenue
      const now = new Date();
      this.totalRevenue = this.hotelService.getMonthlyRevenue(now.getMonth(), now.getFullYear());
    });


    //Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  hasAccess(feature: string): boolean {
    if (!this.currentUser) return false;

    const permissions = {
      'admin': ['rooms', 'bookings', 'guests', 'settings', 'users'],
      'staff': ['rooms', 'bookings', 'guests', 'settings'],
      'guest': ['settings']
    };

    type Role = 'admin' | 'staff' | 'guest';
    const role: Role = this.currentUser.role as Role;
    return permissions[role]?.includes(feature) || false;
  }
}
