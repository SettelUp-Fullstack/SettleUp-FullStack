import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  onLogin() {
    if (!this.email || !this.password) {
      alert('Please enter both email and password');
      return;
    }

    const data = {
      email: this.email,
      password: this.password
    };

    console.log('Login attempt with:', data);

    this.authService.login(data).subscribe({
      next: (res: any) => {
        console.log('Login successful:', res);

        if (res.token) {
          this.authService.saveToken(res.token);
        }

        if (res.user) {
          const userData = {
            name: res.user.name || this.email.split('@')[0],
            email: res.user.email || this.email,
            avatar: this.getInitials(res.user.name || this.email.split('@')[0])
          };
          this.authService.saveUser(userData);
          localStorage.setItem('registeredUser', JSON.stringify(userData));
        }

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        if (err.status === 401) {
          alert('Invalid email or password');
        } else if (err.status === 404) {
          alert('User not found. Please register first.');
        } else {
          alert(err.error?.message || 'Login failed. Please try again.');
        }
      }
    });
  }
}