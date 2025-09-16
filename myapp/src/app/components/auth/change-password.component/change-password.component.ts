import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-password',
   imports: [CommonModule, FormsModule],
  templateUrl:'./change-password.component.html',
  styleUrl:'./change-password.component.css'
})
export class ChangePasswordComponent {
  newPassword = '';
  confirmPassword = '';

  constructor(private authService: AuthService, private router: Router) {}

  async changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const success = await this.authService.updatePassword(this.newPassword);

    if (success) {
      alert('Password updated successfully!');
      this.router.navigate(['/signin']); // redirect to login after change
    } else {
      alert('Failed to update password. Please try again.');
    }
  }
}
