import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, shareReplay, timeout, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Member {
  name: string;
  email: string;
  _id?: string;
}

export interface Group {
  _id: string;
  name: string;
  type: string;
  members: Member[];
  createdBy?: string;
  createdAt?: string;
  totalExpenses?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;

  private groupsSubject = new BehaviorSubject<Group[]>([]);
  groups$ = this.groupsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  private groupsCache: Group[] | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private fetchInProgress = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      setTimeout(() => this.preloadGroups(), 0);
    }
  }

  private preloadGroups(): void {
    const token = this.authService.getToken();
    if (token && !this.groupsCache) {
      this.fetchGroups(true).subscribe();
    }
  }

  fetchGroups(forceRefresh: boolean = false): Observable<any> {
    const now = Date.now();
    const token = this.authService.getToken();

    if (!this.isBrowser || !token) {
      return of({ success: true, data: [] });
    }

    if (!forceRefresh && 
        this.groupsCache && 
        (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return of({ success: true, data: this.groupsCache });
    }

    if (this.fetchInProgress) {
      return new Observable(observer => {
        const checkInterval = setInterval(() => {
          if (!this.fetchInProgress) {
            clearInterval(checkInterval);
            observer.next({ success: true, data: this.groupsCache || [] });
            observer.complete();
          }
        }, 100);
      });
    }

    this.fetchInProgress = true;
    this.loadingSubject.next(true);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/groups`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success && response.data) {
            this.groupsCache = response.data;
            this.lastFetchTime = Date.now();
            this.groupsSubject.next(response.data);
          }
        }),
        catchError(error => {
          console.error('GroupService - fetchGroups error:', error);
          if (this.groupsCache) {
            return of({ success: true, data: this.groupsCache });
          }
          return throwError(() => error);
        }),
        finalize(() => {
          this.loadingSubject.next(false);
          this.fetchInProgress = false;
        })
      );
  }

  getGroups(): Group[] {
    return this.groupsSubject.getValue();
  }

  createGroup(groupData: any): Observable<any> {
    const token = this.authService.getToken();

    if (!this.isBrowser || !token) {
      return of({ success: false, message: 'Not authenticated' });
    }

    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const optimisticGroup = {
      ...groupData,
      _id: tempId,
      createdAt: new Date().toISOString(),
      members: groupData.members || []
    };
    
    const currentGroups = this.groupsSubject.getValue();
    this.groupsSubject.next([optimisticGroup, ...currentGroups]);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/groups`, groupData, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success && response.data) {
            const updatedGroups = this.groupsSubject.getValue().map(g => 
              g._id === tempId ? response.data : g
            );
            this.groupsSubject.next(updatedGroups);
            this.groupsCache = updatedGroups;
            this.lastFetchTime = Date.now();
          }
        }),
        catchError(error => {
          console.error('GroupService - createGroup error:', error);
          const revertedGroups = this.groupsSubject.getValue().filter(g => g._id !== tempId);
          this.groupsSubject.next(revertedGroups);
          return of({ success: false, error: error.message });
        })
      );
  }

  deleteGroup(groupId: string): Observable<any> {
    const token = this.authService.getToken();

    if (!this.isBrowser || !token) {
      return of({ success: false, message: 'Not authenticated' });
    }
    
    if (groupId.startsWith('temp_')) {
      const currentGroups = this.groupsSubject.getValue();
      this.groupsSubject.next(currentGroups.filter(g => g._id !== groupId));
      return of({ success: true, message: 'Temporary group removed' });
    }
    
    const currentGroups = this.groupsSubject.getValue();
    this.groupsSubject.next(currentGroups.filter(g => g._id !== groupId));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(`${this.apiUrl}/groups/${groupId}`, { headers })
      .pipe(
        timeout(5000),
        tap(response => {
          if (response.success) {
            this.groupsCache = this.groupsSubject.getValue();
            this.lastFetchTime = Date.now();
          }
        }),
        catchError(error => {
          console.error('GroupService - deleteGroup error:', error);
          this.groupsSubject.next(currentGroups);
          return of({ success: false, error: error.message });
        })
      );
  }

  getGroupById(groupId: string): Group | undefined {
    return this.groupsSubject.getValue().find(g => g._id === groupId);
  }

  clearCache(): void {
    this.groupsCache = null;
    this.lastFetchTime = 0;
  }

  refreshGroups(): Observable<any> {
    return this.fetchGroups(true);
  }
}