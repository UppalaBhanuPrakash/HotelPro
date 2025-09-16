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
      { path: 'rooms', component: RoomsComponent },
       { path: 'bookings', component: BookingsComponent },
      { path: 'guests', component: GuestsComponent },
      { path: 'settings', component: SettingsComponent },
      {path:'service',component:ServicesComponent},
      {path:'userBooking',component:UserBookingComponent}
    ]
  },
  { path: '**', redirectTo: '/signin' }
];