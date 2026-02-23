import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const loginGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  console.log('LoginGuard - Checking if already logged in...');

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log('LoginGuard - User already logged in, redirecting to dashboard');
      router.navigate(['/dashboard']);
      return false;
    }
  }
  
  console.log('LoginGuard - Access granted to login/register page');
  return true;
};