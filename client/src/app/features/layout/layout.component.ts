import { RouterModule, Router } from '@angular/router';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  user: any = {
    name: '',
    email: '',
    avatar: ''
  };
  
  logoPath = '/assets/logo.png';
  logoLoaded = true;
  
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private authService: AuthService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadUserData();
    }
  }

  loadUserData() {
    try {
      const user = this.authService.getUser();
      if (user) {
        this.user = user;
      } else {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          this.user = JSON.parse(savedUser);
        } else {
          const registeredUser = localStorage.getItem('registeredUser');
          if (registeredUser) {
            this.user = JSON.parse(registeredUser);
            this.authService.saveUser(this.user);
          }
        }
      }
      
      if (this.user.name && !this.user.avatar) {
        this.user.avatar = this.getInitials(this.user.name);
        this.authService.saveUser(this.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  logout() {
    if (this.isBrowser) {
      this.authService.logout();
    }
  }

  onLogoLoad() {
    this.logoLoaded = true;
  }

  onLogoError() {
    this.logoLoaded = false;
  }

  updateUserData(updatedUser: any) {
    if (this.isBrowser) {
      this.user = { ...this.user, ...updatedUser };
      if (!this.user.avatar && this.user.name) {
        this.user.avatar = this.getInitials(this.user.name);
      }
      this.authService.saveUser(this.user);
    }
  }
}
