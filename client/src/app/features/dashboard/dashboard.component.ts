import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardData } from '../../services/dashboard.service';
import { Subscription } from 'rxjs';

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
  isLoading = true;
  errorMessage: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    console.log('DashboardComponent - Initializing');
    
    this.subscriptions.push(
      this.dashboardService.dashboardData$.subscribe(data => {
        console.log('DashboardComponent - Data received:', data);
        this.dashboardData = data;
      })
    );

    this.subscriptions.push(
      this.dashboardService.loading$.subscribe(loading => {
        console.log('DashboardComponent - Loading state:', loading);
        this.isLoading = loading;
      })
    );

    this.subscriptions.push(
      this.dashboardService.error$.subscribe(error => {
        console.log('DashboardComponent - Error state:', error);
        this.errorMessage = error;
      })
    );

    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData() {
    console.log('DashboardComponent - Loading dashboard data');
    this.dashboardService.fetchDashboardStats().subscribe({
      error: (error) => {
        console.error('DashboardComponent - Fetch error:', error);
      }
    });
  }

  refreshDashboard() {
    console.log('DashboardComponent - Refreshing dashboard');
    this.dashboardService.refreshDashboard();
  }
  
  get hasRecentGroups(): boolean {
    return !!(this.dashboardData?.recentGroups && this.dashboardData.recentGroups.length > 0);
  }

  get hasRecentExpenses(): boolean {
    return !!(this.dashboardData?.recentExpenses && this.dashboardData.recentExpenses.length > 0);
  }
  
  retryLoading() {
    console.log('DashboardComponent - Retrying load');
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