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
    confirmPassword: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get isNameInvalid(): boolean {
    if (!this.userData.name) return false; 
    const nameRegex = /^[a-zA-Z\s]{3,}$/;
    return !nameRegex.test(this.userData.name);
  }

  get isEmailInvalid(): boolean {
    if (!this.userData.email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(this.userData.email);
  }

  get isPasswordInvalid(): boolean {
    if (!this.userData.password) return false;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return !passwordRegex.test(this.userData.password);
  }

  get passwordMismatch(): boolean {
    return this.userData.confirmPassword.length > 0 &&
           this.userData.password !== this.userData.confirmPassword;
  }

  async onSubmit() {
    if (this.loading) return;

    if (this.isNameInvalid) {
      this.errorMessage = 'Name must have at least 3 characters and contain only letters.';
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
