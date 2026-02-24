import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BalanceService, BalancesData } from '../../services/balance.service';
import { GroupService } from '../../services/group.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './balances.component.html',
  styleUrls: ['./balances.component.css']
})
export class BalancesComponent implements OnInit, OnDestroy {
  Math = Math;
  
  balancesData: BalancesData | null = null;
  userGroups: any[] = [];
  selectedGroup: any = null;
  
  isLoading = true;
  errorMessage: string | null = null;
  showGroupsList = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private balanceService: BalanceService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.balanceService.balancesData$.subscribe(data => {
        this.balancesData = data;
      })
    );

    this.subscriptions.push(
      this.balanceService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.subscriptions.push(
      this.balanceService.error$.subscribe(error => {
        this.errorMessage = error;
      })
    );

    this.subscriptions.push(
      this.groupService.groups$.subscribe(groups => {
        this.userGroups = groups || [];
      })
    );

    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    this.groupService.fetchGroups().subscribe({
      error: (error) => console.error('Error loading groups:', error)
    });

    this.balanceService.fetchBalances().subscribe({
      error: (error) => console.error('Error loading balances:', error)
    });
  }

  refreshBalances() {
    this.balanceService.refreshBalances();
  }

  get hasIndividualBalances(): boolean {
    return !!(this.balancesData?.individualBalances && this.balancesData.individualBalances.length > 0);
  }

  get hasSettlements(): boolean {
    return !!(this.balancesData?.settlements && this.balancesData.settlements.length > 0);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  toggleGroupsList() {
    this.showGroupsList = !this.showGroupsList;
  }

  selectGroup(group: any) {
    this.selectedGroup = group;
    this.showGroupsList = false;
  }

  clearGroupSelection() {
    this.selectedGroup = null;
  }

  viewAllGroups() {
    this.selectedGroup = null;
    this.showGroupsList = false;
  }

  retryLoading() {
    this.errorMessage = null;
    this.loadData();
  }

  trackByEmail(index: number, balance: any): string {
    return balance.email;
  }

  trackBySettlement(index: number, settlement: any): string {
    return settlement.from + settlement.to;
  }

  trackByGroupId(index: number, group: any): string {
    return group._id || index.toString();
  }
}
