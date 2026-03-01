import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Your Render backend URL
  private apiUrl = 'https://settleup-fullstack.onrender.com/api';

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /* ============================
     AUTH API CALLS
  ============================ */

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response?.token) {
            this.saveToken(response.token);
          }
          if (response?.user) {
            this.saveUser(response.user);
          }
        })
      );
  }

  register(userData: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData);
  }

  /* ============================
     TOKEN STORAGE
  ============================ */

  getToken(): string | null {
    if (this.isBrowser) {
      try {
        return localStorage.getItem('token');
      } catch {
        return null;
      }
    }
    return null;
  }

  saveToken(token: string): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem('token', token);
      } catch {}
    }
  }

  removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }

  /* ============================
     USER STORAGE
  ============================ */

  getUser(): any {
    if (this.isBrowser) {
      try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  saveUser(user: any): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch {}
    }
  }

  removeUser(): void {
    if (this.isBrowser) {
      localStorage.removeItem('user');
    }
  }

  /* ============================
     AUTH STATE
  ============================ */

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    if (this.isBrowser) {
      this.removeToken();
      this.removeUser();
      this.router.navigate(['/login']);
    }
  }
}
