import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, timeout, retry, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface DashboardStats {
  totalGroups: number;
  totalExpenses: {
    amount: number;
    count: number;
  };
  yourBalance: {
    youAreOwed: number;
    youOwe: number;
    netBalance: number;
  };
  unsettled: number;
  pendingSettlements: number;
  completedSettlements: number;
}

export interface RecentGroup {
  _id: string;
  name: string;
  type: string;
  createdAt: string;
  members: any[];
}

export interface RecentExpense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  groupName: string;
  paidBy: string;
  splitCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentGroups: RecentGroup[];
  recentExpenses: RecentExpense[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/api';
  private isBrowser: boolean;

  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  dashboardData$ = this.dashboardDataSubject.asObservable();

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

  fetchDashboardStats(showLoading: boolean = true): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      this.errorSubject.next('Authentication required');
      return throwError(() => new Error('No authentication token'));
    }

    if (showLoading) this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`, { headers })
      .pipe(
        timeout(10000),
        retry(1),
        tap(response => {
          if (response && response.success) {
            this.dashboardDataSubject.next(response.data);
            this.errorSubject.next(null);
          } else {
            this.errorSubject.next('Failed to load dashboard data');
          }
          if (showLoading) this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('DashboardService - Error:', error);
          
          let errorMessage = 'Error loading dashboard';
          if (error.status === 0) errorMessage = 'Cannot connect to server';
          else if (error.status === 401) errorMessage = 'Session expired';
          else if (error.status === 404) errorMessage = 'Dashboard API not found';
          else if (error.name === 'TimeoutError') errorMessage = 'Request timeout';
          
          this.errorSubject.next(errorMessage);
          if (showLoading) this.loadingSubject.next(false);
          
          return throwError(() => error);
        })
      );
  }

  getDashboardData(): DashboardData | null {
    return this.dashboardDataSubject.getValue();
  }

  refreshDashboard(): void {
    this.fetchDashboardStats(true).subscribe();
  }

  clearCache(): void {
    this.dashboardDataSubject.next(null);
  }

  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  getError(): string | null {
    return this.errorSubject.getValue();
  }

  hasData(): boolean {
    return this.dashboardDataSubject.getValue() !== null;
  }
}