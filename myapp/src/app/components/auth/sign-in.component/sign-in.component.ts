import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl:'./sign-in.component.css'
})
export class SignInComponent {
  credentials = {
    email: '',
    password: ''
  };
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (this.loading) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    try {
      const success = await this.authService.signIn(
        this.credentials.email, 
        this.credentials.password
      );
      
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Invalid email or password';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}