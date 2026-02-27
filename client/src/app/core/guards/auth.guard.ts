import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const authService = inject(AuthService);

  console.log('AuthGuard - Checking authentication...');

  if (isPlatformBrowser(platformId)) {
    const token = authService.getToken();
    console.log('AuthGuard - Token exists:', !!token);

    if (token) {
      console.log('AuthGuard - Access granted');
      return true;
    } else {
      console.log('AuthGuard - No token, redirecting to login');
      // Return UrlTree instead of using router.navigate() for SSR compatibility
      const urlTree = router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      return urlTree;
    }
  }

  console.log('AuthGuard - Not in browser, allowing navigation for SSR');
  // Allow navigation during SSR, let client-side handle auth check
  return true;
};
