import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, timeout, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Expense {
  _id?: string;
  description: string;
  amount: number;
  category: string;
  group: string | any;
  paidBy: string;
  paidByName?: string;
  splits?: any[];
  date?: Date;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;

  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  private expensesCache: Expense[] | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 30000;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  fetchExpenses(forceRefresh = false): Observable<any> {
    const now = Date.now();
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'No token found' });
    }
    
    if (!forceRefresh && this.expensesCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return of({ success: true, data: this.expensesCache });
    }

    this.loadingSubject.next(true);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/expenses`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success && response.data) {
            const processedExpenses = response.data.map((expense: any) => this.processExpense(expense));
            this.expensesCache = processedExpenses;
            this.lastFetchTime = now;
            this.expensesSubject.next(processedExpenses);
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          console.error('ExpenseService - fetchExpenses error:', error);
          this.loadingSubject.next(false);
          return of({ success: false, error: error.message });
        })
      );
  }

  private processExpense(expense: any): Expense {
    return {
      ...expense,
      group: expense.group || { _id: expense.group, name: 'Unknown Group' },
      paidByName: this.getPaidByName(expense)
    };
  }

  private getPaidByName(expense: any): string {
    if (expense.paidByName) return expense.paidByName;
    
    if (expense.group && expense.group.members) {
      const payer = expense.group.members.find((m: any) => 
        m.email === expense.paidBy || m._id === expense.paidBy
      );
      return payer?.name || expense.paidBy;
    }
    
    return expense.paidBy;
  }

  getExpenses(): Expense[] {
    return this.expensesSubject.getValue();
  }

  createExpense(expenseData: any): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const tempId = 'temp_' + Date.now();
    const optimisticExpense: Expense = {
      ...expenseData,
      _id: tempId,
      createdAt: new Date().toISOString(),
      group: expenseData.group,
      paidByName: expenseData.paidByName
    };

    const currentExpenses = this.expensesSubject.getValue();
    this.expensesSubject.next([optimisticExpense, ...currentExpenses]);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/expenses`, expenseData, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success && response.data) {
            const processedExpense = this.processExpense(response.data);
            const updatedExpenses = this.expensesSubject.getValue().map(e => 
              e._id === tempId ? processedExpense : e
            );
            this.expensesSubject.next(updatedExpenses);
            this.expensesCache = updatedExpenses;
            this.lastFetchTime = Date.now();
          }
        }),
        catchError(error => {
          console.error('ExpenseService - createExpense error:', error);
          const revertedExpenses = this.expensesSubject.getValue().filter(e => e._id !== tempId);
          this.expensesSubject.next(revertedExpenses);
          return of({ success: false, error: error.message });
        })
      );
  }

  deleteExpense(expenseId: string): Observable<any> {
    const token = this.authService.getToken();

    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'Not authenticated' });
    }
    
    if (expenseId.startsWith('temp_')) {
      const currentExpenses = this.expensesSubject.getValue();
      this.expensesSubject.next(currentExpenses.filter(e => e._id !== expenseId));
      return of({ success: true, message: 'Temporary expense removed' });
    }
    
    const currentExpenses = this.expensesSubject.getValue();
    const expenseToDelete = currentExpenses.find(e => e._id === expenseId);
    this.expensesSubject.next(currentExpenses.filter(e => e._id !== expenseId));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(`${this.apiUrl}/expenses/${expenseId}`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.expensesCache = this.expensesSubject.getValue();
            this.lastFetchTime = Date.now();
          }
        }),
        catchError(error => {
          console.error('ExpenseService - deleteExpense error:', error);
          if (expenseToDelete) {
            this.expensesSubject.next([expenseToDelete, ...this.expensesSubject.getValue()]);
          }
          return of({ success: false, error: error.message });
        })
      );
  }

  getExpensesByGroup(groupId: string): Observable<any> {
    const token = this.authService.getToken();
    
    if (!token || !this.isBrowser) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/expenses/group/${groupId}`, { headers })
      .pipe(
        timeout(5000),
        catchError(error => {
          console.error('Error fetching expenses by group:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  getGroupName(expense: Expense): string {
    if (!expense.group) return 'Unknown Group';
    if (typeof expense.group === 'object' && expense.group.name) {
      return expense.group.name;
    }
    return 'Unknown Group';
  }

  clearCache(): void {
    this.expensesCache = null;
    this.lastFetchTime = 0;
  }

  refreshExpenses(): Observable<any> {
    return this.fetchExpenses(true);
  }
}