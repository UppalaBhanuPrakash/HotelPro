import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import emailjs from 'emailjs-com';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  resendLoading = false;
  errorMessage = '';
  emailSent = false;

  generatedOtp: string = '';
  enteredOtp: string = '';
  showOtpModal = false;
  otpError = '';

  constructor(private router: Router) { }

  async onSubmit() {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    try {

      await new Promise(resolve => setTimeout(resolve, 2000));

      this.emailSent = true;
    } catch (error) {
      this.errorMessage = 'Failed to send reset email. Please try again.';
    } finally {
      this.loading = false;
    }
  }
  async resendEmail() {
    if (this.resendLoading) return;
    this.resendLoading = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    catch (error) {
      this.errorMessage = 'Failed to resend email. Please try again.';
    }
    finally {
      this.resendLoading = false;

    }
  }
  sendOtp() {
    if (!this.email) return;


    this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    setTimeout(() => {
      this.generatedOtp = '';
    }, 60000)
    const templateParams = {
      to_email: this.email,
      subject: 'Password Reset OTP',
      message: `Your OTP for password reset is: ${this.generatedOtp}`
    };


    emailjs.send('service_7isdned', 'template_37pfzmj', templateParams, 'r5qxB0JYxzao5YQyP')
      .then(() => {
        console.log('OTP sent successfully');
        this.showOtpModal = true;
      })
      .catch(err => {
        console.error('Error sending OTP:', err);
      });
  }


  verifyOtp() {
    if (this.enteredOtp === this.generatedOtp) {
      this.otpError = '';
      this.showOtpModal = false;
      this.router.navigate(['/change-password']);
    } else {
      this.otpError = 'Invalid OTP. Please try again.';
    }
  }

}