import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, timeout, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Settlement {
  _id?: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  group: string | any;
  groupName: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: string;
  notes?: string;
  settledBy: string;
  settledAt: Date;
  completedAt?: Date;
  relatedExpenses?: string[];
}

export interface SettlementStats {
  totalSettlements: number;
  pendingAmount: number;
  completedAmount: number;
  receivedAmount: number;
  paidAmount: number;
  pendingCount: number;
  completedCount: number;
  netSettled: number;
}

export interface SettlementHistory {
  id: string;
  date: Date;
  completedAt?: Date;
  amount: number;
  type: 'paid' | 'received';
  counterparty: string;
  counterpartyEmail: string;
  group: any;
  groupName: string;
  status: string;
  paymentMethod?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;

  private settlementsSubject = new BehaviorSubject<Settlement[]>([]);
  settlements$ = this.settlementsSubject.asObservable();

  private historySubject = new BehaviorSubject<SettlementHistory[]>([]);
  history$ = this.historySubject.asObservable();

  private statsSubject = new BehaviorSubject<SettlementStats>({
    totalSettlements: 0,
    pendingAmount: 0,
    completedAmount: 0,
    receivedAmount: 0,
    paidAmount: 0,
    pendingCount: 0,
    completedCount: 0,
    netSettled: 0
  });
  stats$ = this.statsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  fetchSettlements(forceRefresh = false): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false });
    }

    this.loadingSubject.next(true);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/settlements`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.settlementsSubject.next(response.data);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('SettlementService - fetchSettlements error:', error);
          this.loadingSubject.next(false);
          return of({ success: false, error: error.message });
        })
      );
  }

  fetchHistory(): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/settlements/history/me`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.historySubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('SettlementService - fetchHistory error:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  fetchStats(): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/settlements/stats/summary`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.statsSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('SettlementService - fetchStats error:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  createSettlement(settlementData: any): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/settlements`, settlementData, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.fetchSettlements(true).subscribe();
            this.fetchHistory().subscribe();
            this.fetchStats().subscribe();
          }
        }),
        catchError(error => {
          console.error('SettlementService - createSettlement error:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  completeSettlement(settlementId: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.patch<any>(`${this.apiUrl}/settlements/${settlementId}/complete`, {}, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.fetchSettlements(true).subscribe();
            this.fetchHistory().subscribe();
            this.fetchStats().subscribe();
          }
        }),
        catchError(error => {
          console.error('SettlementService - completeSettlement error:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  deleteSettlement(settlementId: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(`${this.apiUrl}/settlements/${settlementId}`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.fetchSettlements(true).subscribe();
            this.fetchHistory().subscribe();
            this.fetchStats().subscribe();
          }
        }),
        catchError(error => {
          console.error('SettlementService - deleteSettlement error:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  getSettlementsByGroup(groupId: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/settlements/group/${groupId}`, { headers })
      .pipe(
        timeout(5000),
        catchError(error => {
          console.error('SettlementService - getSettlementsByGroup error:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  clearCache(): void {
    this.settlementsSubject.next([]);
    this.historySubject.next([]);
    this.statsSubject.next({
      totalSettlements: 0,
      pendingAmount: 0,
      completedAmount: 0,
      receivedAmount: 0,
      paidAmount: 0,
      pendingCount: 0,
      completedCount: 0,
      netSettled: 0
    });
  }

  refreshSettlements(): void {
    this.fetchSettlements(true).subscribe();
  }
}