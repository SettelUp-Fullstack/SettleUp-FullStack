import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardData } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  Math = Math;

  dashboardData: DashboardData | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Skip data loading during SSR
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      return;
    }

    // Subscribe to loading state from service
    this.subscriptions.push(
      this.dashboardService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to dashboard data
    this.subscriptions.push(
      this.dashboardService.dashboardData$.subscribe(data => {
        this.dashboardData = data;
        // Ensure loading is hidden when data arrives
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    );

    // Subscribe to errors
    this.subscriptions.push(
      this.dashboardService.error$.subscribe(error => {
        this.errorMessage = error;
        // Hide loading on error
        if (error) {
          this.isLoading = false;
        }
        this.cdr.detectChanges();
      })
    );

    // Check authentication before loading
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Please login to view dashboard';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Load dashboard data
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData() {
    // Clear previous error
    this.errorMessage = null;
    
    // Check cache - if we have cached data, use it
    const cachedData = this.dashboardService.getDashboardData();
    if (cachedData) {
      this.dashboardData = cachedData;
      this.isLoading = false;
      return;
    }

    // Call service - it will handle loading state and emissions
    this.dashboardService.fetchDashboardStats(true).subscribe({
      error: (err) => {
        console.error('Dashboard load error:', err);
        // Error is already handled by error$ subscription, but ensure loading is off
        this.isLoading = false;
      }
    });
  }

  refreshDashboard() {
    this.dashboardService.clearCache();
    this.loadDashboardData();
  }
  
  retryLoading() {
    this.errorMessage = null;
    this.loadDashboardData();
  }

  trackByGroupId(index: number, group: any): string {
    return group._id;
  }

  trackByExpenseId(index: number, expense: any): string {
    return expense._id;
  }
}
