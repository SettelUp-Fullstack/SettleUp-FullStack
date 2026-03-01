import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, timeout, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Balance {
  email: string;
  name: string;
  amount: number;
}

export interface Settlement {
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  toName: string;
  toEmail: string;
  amount: number;
}

export interface BalanceSummary {
  youAreOwed: number;
  youOwe: number;
  netBalance: number;
}

export interface BalancesData {
  summary: BalanceSummary;
  individualBalances: Balance[];
  settlements: Settlement[];
}

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private apiUrl = 'http://localhost:3000/api';
  private isBrowser: boolean;

  private balancesDataSubject = new BehaviorSubject<BalancesData | null>(null);
  balancesData$ = this.balancesDataSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  fetchBalances(): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      this.errorSubject.next('Authentication required');
      return throwError(() => new Error('No authentication token'));
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/balances`, { headers })
      .pipe(
        timeout(10000),
        tap(response => {
          if (response && response.success) {
            const balancesData: BalancesData = {
              summary: response.summary || { youAreOwed: 0, youOwe: 0, netBalance: 0 },
              individualBalances: response.individualBalances || [],
              settlements: response.settlements || []
            };
            this.balancesDataSubject.next(balancesData);
            this.errorSubject.next(null);
          } else {
            this.errorSubject.next('Failed to load balances');
          }
        }),
        catchError(error => {
          console.error('BalanceService - Error:', error);
          let errorMessage = 'Error loading balances';
          if (error.status === 401) errorMessage = 'Session expired. Please login again.';
          else if (error.status === 404) errorMessage = 'Balances API not found';
          this.errorSubject.next(errorMessage);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBalancesData(): BalancesData | null {
    return this.balancesDataSubject.getValue();
  }

  refreshBalances(): void {
    this.fetchBalances().subscribe();
  }

  clearCache(): void {
    this.balancesDataSubject.next(null);
  }
}