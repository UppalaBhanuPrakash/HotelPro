import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/interfaces';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl:'./main-layout.component.html' ,
  styleUrl:'./main-layout.component.css' 
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = true;
  sidebarHovered = false;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarHover(hovered: boolean) {
    this.sidebarHovered = hovered;
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/signin']);
  }

  hasAccess(feature: string): boolean {
    if (!this.currentUser) return false;
    
    const permissions = {
      'admin': ['dashboard', 'rooms', 'bookings', 'guests', 'settings', 'services'],
      'staff': ['dashboard', 'rooms', 'bookings', 'guests', 'settings','services'],
      'guest': ['dashboard', 'settings']
    };
    
    return permissions[this.currentUser.role]?.includes(feature) || false;
  }
}