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
    this.subscriptions.push(
      this.dashboardService.dashboardData$.subscribe(data => {
        this.dashboardData = data;
      })
    );

    this.subscriptions.push(
      this.dashboardService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.subscriptions.push(
      this.dashboardService.error$.subscribe(error => {
        this.errorMessage = error;
      })
    );

    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData() {
    this.dashboardService.fetchDashboardStats().subscribe({
      error: (error) => {
        console.error('DashboardComponent - Fetch error:', error);
      }
    });
  }

  refreshDashboard() {
    this.dashboardService.refreshDashboard();
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
