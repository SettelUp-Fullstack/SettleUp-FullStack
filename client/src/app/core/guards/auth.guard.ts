import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  console.log('AuthGuard - Checking authentication...');

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    console.log('AuthGuard - Token exists:', !!token);
    
    if (token) {
      console.log('AuthGuard - Access granted');
      return true;
    } else {
      console.log('AuthGuard - No token, redirecting to login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
  
  console.log('AuthGuard - Not in browser');
  return false;
};