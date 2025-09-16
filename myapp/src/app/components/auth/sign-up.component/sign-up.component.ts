import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'] 
})
export class SignUpComponent {
  userData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  loading = false;
  errorMessage = '';
  successMessage = '';
  

  constructor(
    private authService: AuthService,
    private router: Router,
    
  ) {}

  get passwordMismatch(): boolean {
    return this.userData.password !== this.userData.confirmPassword && 
           this.userData.confirmPassword.length > 0;
  }

  // Name Validation: No special characters, min 3 chars
  get isNameInvalid(): boolean {
    const nameRegex = /^[a-zA-Z\s]{3,}$/; // Only letters and spaces, min 3 chars
    return !nameRegex.test(this.userData.name);
  }

  //  Email Validation: Must have '@' and '.'
  get isEmailInvalid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(this.userData.email);
  }

  //  Password Validation: Min 6 chars, at least 1 uppercase, 1 special char
  get isPasswordInvalid(): boolean {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return !passwordRegex.test(this.userData.password);
  }

  async onSubmit() {
    if (this.loading) return;

    //  Check validations before API call
    if (this.isNameInvalid) {
      this.errorMessage = 'Name must have at least 3 characters and no special symbols.';
      return;
    }
    if (this.isEmailInvalid) {
      this.errorMessage = 'Please enter a valid email address (must include @ and .).';
      return;
    }
    if (this.isPasswordInvalid) {
      this.errorMessage = 'Password must be at least 6 characters, include one uppercase and one special character.';
      return;
    }
    if (this.passwordMismatch) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const success = await this.authService.signUp(
        this.userData.email, 
        this.userData.password,
        this.userData.name
      );

      if (success) {
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 1500);
      } else {
        this.errorMessage = 'Failed to create account. Please try again.';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
