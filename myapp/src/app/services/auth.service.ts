import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/interfaces';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private baseUrl = 'http://localhost:3000/users'; // JSON Server endpoint

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }


getRole(): string | null {
  return this.currentUserSubject.value?.role || null;
}

hasRole(role: string): boolean {
  return this.getRole() === role;
}

hasAnyRole(roles: string[]): boolean {
  return roles.includes(this.getRole() || '');
}

  signIn(email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Fetch user from db.json
      this.http.get<User[]>(`${this.baseUrl}?email=${email}&password=${password}`).subscribe({
        next: (users) => {
          if (users.length > 0) {
            const user = users[0];
            this.currentUserSubject.next(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: (err) => {
          console.error('Error during sign-in:', err);
          reject(false);
        }
      });
    });
  }


  signUp(email: string, password: string, name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    this.http.get<User[]>(this.baseUrl).subscribe({
      next: (users) => {
        if (users.some(u => u.email === email)) {
          reject('Email already exists');
          return;
        }
        

      
        const maxId = users.length > 0 ? Math.max(...users.map(u => +u.id)) : 0;

    
        const user: User = {
          id: (maxId + 1).toString(),
          password,
          email,
          name,
          role: 'guest'
        };

    
        this.http.post<User>(this.baseUrl, { ...user, password }).subscribe({
          next: (response) => {
            this.currentUserSubject.next(response);
            localStorage.setItem('currentUser', JSON.stringify(response));
            resolve(true);
          },
          error: (err) => {
            console.error('Error creating user:', err);
            reject(false);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        reject(false);
      }
    });
  });
}


  updateEmail(newEmail: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const currentUser = this.currentUserSubject.value;

      if (!currentUser) {
        reject('No logged-in user');
        return;
      }

     
      this.http
        .get<User[]>(`${this.baseUrl}?email=${currentUser.email}&password=${password}`)
        .subscribe({
          next: (users) => {
            if (users.length === 0) {
              reject('Incorrect password');
              return;
            }

          
            this.http.get<User[]>(`${this.baseUrl}?email=${newEmail}`).subscribe({
              next: (existingUsers) => {
                if (existingUsers.length > 0) {
                  reject('Email already in use');
                  return;
                }

                const updatedUser = { ...currentUser, email: newEmail };

                this.http.put<User>(`${this.baseUrl}/${currentUser.id}`, updatedUser).subscribe({
                  next: (response) => {
                    this.currentUserSubject.next(response);
                    localStorage.setItem('currentUser', JSON.stringify(response));
                    resolve(true);
                  },
                  error: (err) => {
                    console.error('Error updating email:', err);
                    reject(false);
                  },
                });
              },
              error: (err) => {
                console.error('Error checking new email:', err);
                reject(false);
              },
            });
          },
          error: (err) => {
            console.error('Error verifying password:', err);
            reject(false);
          },
        });
    });
  }


  changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const currentUser = this.currentUserSubject.value;

      if (!currentUser) {
        reject(false);
        return;
      }

      this.http.get<any[]>(`${this.baseUrl}?email=${currentUser.email}&password=${currentPassword}`).subscribe({
        next: (users) => {
          if (users.length > 0) {
            const existingUser = users[0];
            const updatedUser = { ...existingUser, password: newPassword };

            this.http.put(`${this.baseUrl}/${existingUser.id}`, updatedUser).subscribe({
              next: () => {
                // Update local storage & subject
                this.currentUserSubject.next(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                resolve(true);
              },
              error: (err) => {
                console.error('Error updating password:', err);
                reject(false);
              }
            });
          } else {
            resolve(false); 
          }
        },
        error: (err) => {
          console.error('Error checking current password:', err);
          reject(false);
        }
      });
    });
  }

  getAllUsers() {
    return this.http.get<User[]>(this.baseUrl);
  }


  deleteUser(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

 

  signOut(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

 
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  updateCurrentUser(user: User) {
  this.currentUserSubject.next(user);
  localStorage.setItem('currentUser', JSON.stringify(user));
}

  get currentUser() {
    return this.currentUserSubject.value;
  }

 
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async updatePassword(newPassword: string): Promise<boolean> {
    const currentUser = this.currentUser;
    if (!currentUser) return false;

    try {
      const updatedUser = { ...currentUser, password: newPassword };

      await firstValueFrom(
        this.http.put(`${this.baseUrl}/${currentUser.id}`, updatedUser)
      );

 
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }
}
