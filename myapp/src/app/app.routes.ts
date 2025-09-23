import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { SignInComponent } from './components/auth/sign-in.component/sign-in.component';
import { SignUpComponent } from './components/auth/sign-up.component/sign-up.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password.component/forgot-password.component';
import { DashboardComponent } from './components/dashboard.component/dashboard.component';
import { RoomsComponent } from './components/rooms.component/rooms.component';
import { BookingsComponent } from './components/booking.component/booking.component';
import { GuestsComponent } from './components/guests.component/guests.component';
import { SettingsComponent } from './components/settings.component/settings.component';
import { MainLayoutComponent } from './components/layout/main-layout.component/main-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { ServicesComponent } from './components/service/service';
import { ChangePasswordComponent } from './components/auth/change-password.component/change-password.component';
import { UserBookingComponent } from './components/user-booking/user-booking';
import { RoleGuard } from './guards/Role.guard';
export const routes: Routes = [
   { path: '', redirectTo: '/signin', pathMatch: 'full' },
  { path: 'signin', component: SignInComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'rooms', component: RoomsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'staff'] } },
      { path: 'bookings', component: BookingsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'staff'] } },
      { path: 'guests', component: GuestsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'staff'] } },
      { path: 'settings', component: SettingsComponent, canActivate: [RoleGuard], data: { roles: ['admin','staff','guest'] } },
      { path: 'service', component: ServicesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'staff'] } },
      { path: 'userBooking', component: UserBookingComponent, data: { roles: ['guest', 'admin', 'staff'] } }
    ]
  },
  { path: '**', redirectTo: '/signin' }
];