import { User } from '../../models/interfaces';
import { AuthService } from '../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import emailjs from 'emailjs-com';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'guest';
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
    phone?: string; 
    password:string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab = 'profile';
  currentUser: AppUser | null = null;

  profileLoading = false;
  passwordLoading = false;
  accountLoading = false;
  showAddUserModal = false;
  twoFactorEnabled = false;
  passwordChangeSuccess = false;
  passwordChangeError = '';

  profileData = { name: '', email: '', phone: '', department: '', bio: '' };
  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  accountData = { newEmail: '', confirmEmail: '', password: '', emailVerification: true, loginNotifications: true };

  userFilter = { role: '', status: '', search: '' };
  filteredUsers: AppUser[] = [];
  managedUsers: AppUser[] = [];

  systemSettings = { maintenanceMode: false, autoBackup: true, forcePasswordChange: false, sessionTimeout: true };
  notificationSettings = { emailBookings: true, emailCancellations: true, emailPayments: false, pushBookings: true, pushReminders: true };

  roles = [
    {
      key: 'admin',
      name: 'Administrator',
      permissions: ['dashboard', 'rooms', 'bookings', 'guests', 'users', 'settings', 'reports', 'system']
    },
    {
      key: 'staff',
      name: 'Staff Member',
      permissions: ['dashboard', 'rooms', 'bookings', 'guests']
    },
    {
      key: 'guest',
      name: 'Guest User',
      permissions: ['dashboard']
    }
  ];

  availablePermissions = [
    { key: 'dashboard', name: 'Dashboard Access', description: 'View dashboard and statistics' },
    { key: 'rooms', name: 'Room Management', description: 'Manage hotel rooms and availability' },
    { key: 'bookings', name: 'Booking Management', description: 'Handle reservations and bookings' },
    { key: 'guests', name: 'Guest Management', description: 'Manage guest information and profiles' },
    { key: 'users', name: 'User Management', description: 'Add, edit, and remove users' },
    { key: 'settings', name: 'Settings Access', description: 'Access system settings and configuration' },
    { key: 'reports', name: 'Reports & Analytics', description: 'Generate and view reports' },
    { key: 'system', name: 'System Administration', description: 'Full system administration access' }
  ];

   private dbUrl = 'http://localhost:3000/users';
   private Url='http://localhost:3000/UserManagement'

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

ngOnInit(): void {

    this.loadUsers()
  // Fetch from UserManagement DB instead of main users DB
  this.http.get<AppUser[]>(this.Url).subscribe(users => {
    this.managedUsers = users; 
    this.filteredUsers = [...users];
  });

  // Load current user as before
  this.authService.currentUser$.subscribe((user: User | null) => {
    if (user) {
      this.currentUser = {
        ...user,
        status: 'active',
        lastLogin: new Date().toISOString(),
        permissions: this.getDefaultPermissions(user.role)
      };

      this.profileData = {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        department: '',
        bio: ''
      };
    } else {
      this.currentUser = null;
    }
    
  });
}



  //USER OPERATIONS
  filterUsers(): void {
    this.filteredUsers = this.managedUsers.filter(user => {
      const matchesRole = !this.userFilter.role || user.role === this.userFilter.role;
      const matchesStatus = !this.userFilter.status || user.status === this.userFilter.status;
      const matchesSearch = !this.userFilter.search ||
        user.name.toLowerCase().includes(this.userFilter.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.userFilter.search.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }

  toggleUserStatus(user: AppUser): void {
    const updatedStatus = user.status === 'active' ? 'inactive' : 'active';
    this.http.patch<AppUser>(`${this.dbUrl}/${user.id}`, { status: updatedStatus }).subscribe(() => {
      user.status = updatedStatus;
      this.filterUsers();
    });
  }

 

  addUser(newUser: AppUser): void {
    this.http.post<AppUser>(this.dbUrl, newUser).subscribe(user => {
      user.permissions = user.permissions || this.getDefaultPermissions(user.role);
      this.managedUsers.push(user);
      this.filterUsers();
    });
  }

  // PROFILE & ACCOUNT 
  get passwordMismatch(): boolean {
    return this.passwordData.newPassword !== this.passwordData.confirmPassword && this.passwordData.confirmPassword.length > 0;
  }

  get emailMismatch(): boolean {
    return this.accountData.newEmail !== this.accountData.confirmEmail && this.accountData.confirmEmail.length > 0;
  }

  hasUppercase(password: string): boolean { return /[A-Z]/.test(password); }
  hasLowercase(password: string): boolean { return /[a-z]/.test(password); }
  hasNumber(password: string): boolean { return /\d/.test(password); }
  hasSpecialChar(password: string): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(password); }
private loadUsers(): void {
  this.http.get<AppUser[]>(this.Url).subscribe({
    next: (users) => {
      this.managedUsers = users;
      this.filteredUsers = [...users];
    },
    error: (err) => {
      console.error('Failed to load users:', err);
    }
  });
}
async updateProfile(): Promise<void> {
  if (!this.currentUser) return;

  this.profileLoading = true;

  try {
    // Build update object from scratch
    const updatedUser: Partial<AppUser> = {
      id: this.currentUser.id,
      name: this.profileData.name,
      email: this.profileData.email,
      status: 'active',
      lastLogin: this.currentUser.lastLogin,
      role: this.currentUser.role,
      permissions: this.currentUser.permissions
    };

    // Add phone only if not empty
    if (this.profileData.phone && this.profileData.phone.trim() !== '') {
      updatedUser.phone = this.profileData.phone.trim();
    }

    this.http.patch<AppUser>(`${this.dbUrl}/${this.currentUser.id}`, updatedUser)
      .subscribe({
        next: (response) => {
          this.currentUser = response;
          this.authService.updateCurrentUser(response);
          localStorage.setItem('currentUser', JSON.stringify(response));

          alert('Profile updated successfully!');
        },
        error: (err) => {
          console.error('Failed to update profile:', err);
          alert('Failed to update profile. Check console for details.');
        }
      });
  } finally {
    this.profileLoading = false;
  }
}



  async updateAccount(): Promise<void> {
    if (this.emailMismatch) return;
    this.accountLoading = true;
    try {  const success = await this.authService.updateEmail(
      this.accountData.newEmail,
      this.accountData.password
    );

    if (success) {
      alert('Email updated successfully!');
      this.accountData = {
        newEmail: '',
        confirmEmail: '',
        password: '',
        emailVerification: true,
        loginNotifications: true
      };
    }
  } catch (error: any) {
    alert(error || 'Failed to update email.');
   }
    finally { this.accountLoading = false; }
  }

 async changePassword(): Promise<void> {
  if (!this.currentUser) return;

  // Check if new password matches confirm password
  if (this.passwordMismatch) {
    alert('Passwords do not match.');
    return;
  }

  this.passwordLoading = true;
  try {
    const updatedUser = {
      ...this.currentUser,
      password: this.passwordData.newPassword
    };

    this.http.patch<AppUser>(`${this.dbUrl}/${this.currentUser.id}`, updatedUser)
      .subscribe({
        next: (response) => {
          // Update local state
          this.currentUser = response;
          this.authService.updateCurrentUser(response);
          localStorage.setItem('currentUser', JSON.stringify(response));

          // Reset form and show success
          this.passwordChangeSuccess = true;
          this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
          setTimeout(() => this.passwordChangeSuccess = false, 3000);

          alert('Password updated successfully!');
        },
        error: (err) => {
          console.error('Failed to update password:', err);
          alert('Failed to update password. Check console for details.');
        }
      });
  } finally {
    this.passwordLoading = false;
  }
}


  // ROLES & PERMISSIONS 
  toggleRolePermission(roleKey: string, permissionKey: string): void {
    const role = this.roles.find(r => r.key === roleKey);
    if (!role) return;
    const index = role.permissions.indexOf(permissionKey);
    if (index > -1) role.permissions.splice(index, 1);
    else role.permissions.push(permissionKey);
  }
  canManageUsers(): boolean {
  return this.currentUser?.role === 'admin';
}

canAccessPermissions(): boolean {
  return this.currentUser?.role === 'admin';
}

canAccessSystem(): boolean {
  return this.currentUser?.role === 'admin';
}

savePermissions(): void {
  if (!confirm('Are you sure you want to save these permission changes?')) return;

  const saveObservables = this.roles.flatMap(role => {
    const usersToUpdate = this.managedUsers.filter(u => u.role === role.key);
    return usersToUpdate.map(user => 
      this.http.patch<AppUser>(`${this.Url}/${user.id}`, { permissions: role.permissions })
    );
  });

  if (saveObservables.length > 0) {
    forkJoin(saveObservables).subscribe({
      next: () => {
        alert('Permissions saved successfully!');
        // Reload users from backend to sync UI
        this.http.get<AppUser[]>(this.Url).subscribe(users => {
          this.managedUsers = users;
          this.filterUsers();
        });
      },
      error: err => {
        console.error('Failed to save permissions:', err);
        alert('Failed to save permissions. Check console for details.');
      }
    });
  } else {
    alert('No users to update.');
  }
}
  toggleTwoFactor(): void { this.twoFactorEnabled = !this.twoFactorEnabled; }

  getUserInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').substring(0, 2); }

  editUser(user: AppUser): void { console.log('Edit user:', user); }
  managePermissions(user: AppUser): void { console.log('Manage permissions:', user); }

  canAccessSystemSettings(): boolean { return this.currentUser?.role === 'admin'; }
  saveNotificationSettings(): void { console.log('Notification settings saved:', this.notificationSettings); }

 
  getDefaultPermissions(role: 'admin' | 'staff' | 'guest'): string[] {
    const r = this.roles.find(r => r.key === role);
    return r ? [...r.permissions] : [];
  }

get currentUserPermissions(): string[] {
  if (!this.currentUser) return []; // handle null case safely
  const role = this.roles.find(r => r.key === this.currentUser?.role);
  return role ? [...role.permissions] : [];
}
showRoleSelection = false;
  showUserForm = false;
  selectedRole: 'admin' | 'staff' | null = null;

  newUser = { email: '', password: '', confirmPassword: '' };

  selectRole(role: 'admin' | 'staff') {
    this.selectedRole = role;
    this.showRoleSelection = false;
    this.showUserForm = true;
  }

 async createUser() {
  if (!this.newUser.email || !this.newUser.password || !this.selectedRole) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    // 1. Load existing users from MAIN users DB
    const users = await this.http.get<User[]>(this.dbUrl).toPromise();

    // 2. Find max ID in USERS table
    const maxId = users && users.length > 0
      ? Math.max(...users.map(u => Number(u.id)))
      : 0;

    // 3. Generate next ID
    const nextId = (maxId + 1).toString();

    // 4. Insert into MAIN users table (only allowed fields)
    const newUserEntry: User = {
      id: nextId,
      email: this.newUser.email,
      name: this.newUser.email.split('@')[0],
      role: this.selectedRole,
      phone: '',
      password:this.newUser.password,
    };

    await this.http.post<User>(this.dbUrl, newUserEntry).toPromise();

    // 5. Insert into UserManagement (full details)
    const managementUser: AppUser = {
      id: nextId,
      name: newUserEntry.name,
      email: newUserEntry.email,
      role: newUserEntry.role,
      status: 'active',
      lastLogin: new Date().toISOString(),
      permissions: this.getDefaultPermissions(this.selectedRole),
      phone: '',
      password:newUserEntry.password,
    };

    const createdUser = await this.http.post<AppUser>(this.Url, managementUser).toPromise();

    if (createdUser) {
      this.managedUsers.push(createdUser);
      this.filterUsers();
    }

    // 6. Send email
    const templateParams = { email: newUserEntry.email, password: this.newUser.password };
    await emailjs.send('service_7isdned', 'template_9x2xhts', templateParams, 'r5qxB0JYxzao5YQyP');

    alert('User created successfully & email sent!');
    this.newUser = { email: '', password: '', confirmPassword: '' };
    this.selectedRole = null;

    this.showAddUserModal = false;
    this.showUserForm = false;


  } catch (err) {
    console.error('Error creating user:', err);
    alert(`Failed to create user: ${err}`);
  }
}

  resetPassword(user: AppUser): void {
    const tempPassword = 'Temp@123';
    const updatedUser = { ...user, password: tempPassword, forcePasswordChange: true };

    this.http.patch<AppUser>(`${this.Url}/${user.id}`, updatedUser).subscribe({
      next: () => {
        alert(`Password reset. Temporary password is: ${tempPassword}`);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        alert('Failed to reset password.');
      }
    });
  }
  deleteUser(userId: string): void {
  if (!confirm('Are you sure you want to delete this user?')) return;

  this.http.delete(`${this.Url}/${userId}`).subscribe({
    next: () => {
      this.managedUsers = this.managedUsers.filter(u => u.id !== userId);
      this.filterUsers();
      alert('User deleted successfully!');
    },
    error: (err) => {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Check console for details.');
    }
  });
}

}



