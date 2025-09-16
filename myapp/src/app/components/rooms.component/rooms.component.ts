import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { Room } from '../../models/interfaces';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  showAddModal = false;
  showEditModal = false;
  currentRoom: Partial<Room> = this.getEmptyRoom();

  availableAmenities = ['WiFi','TV','Air Conditioning','Mini Bar','Balcony','Jacuzzi','Room Service','Safe','Coffee Maker','Microwave'];

  constructor(private hotelService: HotelService) {}

  ngOnInit() {
    this.loadRooms();
  }

 loadRooms() {
  this.hotelService.getRooms().subscribe({
    next: data => {
      // Sort by room number (numerically)
      this.rooms = data.sort((a, b) => Number(a.number) - Number(b.number));
    },
    error: err => console.error(err)
  });
}
  get availableCount() { return this.rooms.filter(r => r.status === 'available').length; }
  get occupiedCount() { return this.rooms.filter(r => r.status === 'occupied').length; }
  get maintenanceCount() { return this.rooms.filter(r => r.status === 'maintenance').length; }
  get reservedCount() { return this.rooms.filter(r => r.status === 'reserved').length; }

  getEmptyRoom(): Partial<Room> {
    return { number:'', type:'single', price:0, status:'available', description:'', amenities:[] };
  }

  editRoom(room: Room) {
    this.currentRoom = {...room};
    this.showEditModal = true;
  }

  deleteRoom(id: string) {
    if(confirm('Delete room?')) {
      this.hotelService.deleteRoom(id).subscribe({
        next: () => this.loadRooms(),
        error: err => console.error(err)
      });
    }
  }

  toggleAmenity(amenity: string) {
    if(!this.currentRoom.amenities) this.currentRoom.amenities = [];
    const i = this.currentRoom.amenities.indexOf(amenity);
    i > -1 ? this.currentRoom.amenities.splice(i,1) : this.currentRoom.amenities.push(amenity);
  }

  saveRoom() {
    if(this.showAddModal) {
      this.hotelService.addRoom(this.currentRoom as Omit<Room,'id'>).subscribe(() => this.loadRooms());
    } else if(this.showEditModal && this.currentRoom.id) {
      this.hotelService.updateRoom(this.currentRoom.id, this.currentRoom).subscribe(() => this.loadRooms());
    }
    this.closeModal();
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.currentRoom = this.getEmptyRoom();
  }
}
