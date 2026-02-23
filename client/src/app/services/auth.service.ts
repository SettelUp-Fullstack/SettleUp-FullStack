import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Safe localStorage getter
  getToken(): string | null {
    if (this.isBrowser) {
      try {
        return localStorage.getItem('token');
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // Safe localStorage setter
  saveToken(token: string): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem('token', token);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }

  // Safe localStorage getter for user
  getUser(): any {
    if (this.isBrowser) {
      try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // Safe localStorage setter for user
  saveUser(user: any): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }

  // Logout with navigation
  logout(): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('registeredUser');
        console.log('Logout successful');
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = '/login';
      }
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Login method
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  // Register method
  register(userData: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }
}