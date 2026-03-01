import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

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

  isFormValid(): boolean {
    return (
      !!this.name &&
      !!this.email &&
      !!this.password &&
      !!this.confirmPassword &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword
    );
  }

  onRegister() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!this.name || !this.email || !this.password) {
      alert('Please fill in all fields');
      return;
    }

    if (this.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    const userData = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    console.log('Registering user:', userData);

    this.authService.register(userData).subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);

        if (response.token) {
          this.authService.saveToken(response.token);
        }

        const userProfile = {
          name: this.name,
          email: this.email,
          avatar: this.getInitials(this.name)
        };
        localStorage.setItem('user', JSON.stringify(userProfile));
        localStorage.setItem('registeredUser', JSON.stringify(userProfile));

        alert('Account Created Successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Registration error:', error);

        if (error.status === 400) {
          alert(error.error?.message || 'User already exists or invalid data');
        } else if (error.status === 500) {
          alert('Server error. Please try again later.');
        } else {
          alert(error.error?.message || 'Registration failed. Please try again.');
        }
      }
    });
  }
}
