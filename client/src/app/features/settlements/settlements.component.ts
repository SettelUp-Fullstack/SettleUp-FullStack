import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SettlementService, Settlement, SettlementStats, SettlementHistory } from '../../services/settlement.service';
import { GroupService } from '../../services/group.service';
import { ExpenseService } from '../../services/expense.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settlements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settlements.component.html',
  styleUrls: ['./settlements.component.css']
})
export class SettlementsComponent implements OnInit, OnDestroy {
  Math = Math;

  settlements: Settlement[] = [];
  history: SettlementHistory[] = [];
  stats: SettlementStats = {
    totalSettlements: 0,
    pendingAmount: 0,
    completedAmount: 0,
    receivedAmount: 0,
    paidAmount: 0,
    pendingCount: 0,
    completedCount: 0,
    netSettled: 0
  };
  userGroups: any[] = [];
  groupExpenses: any[] = [];

  isLoading = true;
  showModal = false;
  activeTab: 'history' | 'pending' | 'completed' = 'history';
  selectedGroupId: string = '';
  selectedGroup: any = null;
  selectedExpenses: string[] = [];

  newSettlement: any = {
    from: '',
    to: '',
    amount: null,
    paymentMethod: 'cash',
    notes: '',
    relatedExpenses: []
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private settlementService: SettlementService,
    private groupService: GroupService,
    private expenseService: ExpenseService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.settlementService.history$.subscribe(history => {
        this.history = history || [];
      })
    );

    this.subscriptions.push(
      this.settlementService.stats$.subscribe(stats => {
        this.stats = stats;
      })
    );

    this.subscriptions.push(
      this.groupService.groups$.subscribe(groups => {
        this.userGroups = groups || [];
      })
    );

    this.subscriptions.push(
      this.settlementService.loading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    Promise.all([
      this.settlementService.fetchHistory().toPromise(),
      this.settlementService.fetchStats().toPromise(),
      this.groupService.fetchGroups().toPromise()
    ]).catch(error => {
      console.error('Error loading settlement data:', error);
    });
  }

  get pendingSettlements(): Settlement[] {
    return this.settlements.filter(s => s.status === 'pending');
  }

  get completedSettlements(): Settlement[] {
    return this.settlements.filter(s => s.status === 'completed');
  }

  setActiveTab(tab: 'history' | 'pending' | 'completed') {
    this.activeTab = tab;
  }

  openNewSettlementModal() {
    this.showModal = true;
    this.resetForm();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.newSettlement = {
      from: '',
      to: '',
      amount: null,
      paymentMethod: 'cash',
      notes: '',
      relatedExpenses: []
    };
    this.selectedGroupId = '';
    this.selectedGroup = null;
    this.groupExpenses = [];
    this.selectedExpenses = [];
  }

  onGroupSelect() {
    if (this.selectedGroupId) {
      this.selectedGroup = this.userGroups.find(g => g._id === this.selectedGroupId) || null;
      this.loadGroupExpenses();
    }
  }

  loadGroupExpenses() {
    if (this.selectedGroup && this.selectedGroup._id) {
      this.expenseService.getExpensesByGroup(this.selectedGroup._id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.groupExpenses = response.data || [];
          }
        },
        error: (error: any) => {
          console.error('Error loading group expenses:', error);
          this.groupExpenses = [];
        }
      });
    }
  }

  isExpenseSelected(expenseId: string | undefined): boolean {
    return expenseId ? this.selectedExpenses.includes(expenseId) : false;
  }

  toggleExpenseSelection(expenseId: string, event: any) {
    if (!expenseId) return;

    if (event.target.checked) {
      if (!this.selectedExpenses.includes(expenseId)) {
        this.selectedExpenses.push(expenseId);
      }
    } else {
      this.selectedExpenses = this.selectedExpenses.filter(id => id !== expenseId);
    }
    this.newSettlement.relatedExpenses = this.selectedExpenses;
  }

  isValidSettlement(): boolean {
    return (
      !!this.selectedGroupId &&
      !!this.newSettlement.from &&
      !!this.newSettlement.to &&
      this.newSettlement.from !== this.newSettlement.to &&
      !!this.newSettlement.amount &&
      this.newSettlement.amount > 0
    );
  }

  createSettlement() {
    if (!this.isValidSettlement() || !this.selectedGroup) return;

    const fromMember = this.selectedGroup.members?.find((m: any) => m.email === this.newSettlement.from);
    const toMember = this.selectedGroup.members?.find((m: any) => m.email === this.newSettlement.to);

    const settlementData = {
      from: this.newSettlement.from,
      fromName: fromMember?.name || this.newSettlement.from,
      to: this.newSettlement.to,
      toName: toMember?.name || this.newSettlement.to,
      amount: parseFloat(this.newSettlement.amount!.toString()),
      group: this.selectedGroupId,
      groupName: this.selectedGroup.name || '',
      paymentMethod: this.newSettlement.paymentMethod,
      notes: this.newSettlement.notes,
      relatedExpenses: this.selectedExpenses
    };

    this.settlementService.createSettlement(settlementData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.closeModal();
        }
      },
      error: (error: any) => {
        console.error('Error creating settlement:', error);
        alert(error.error?.message || 'Error creating settlement');
      }
    });
  }

  markAsCompleted(settlementId: string | undefined) {
    if (!settlementId) {
      console.error('Cannot mark settlement as completed: No ID provided');
      return;
    }

    if (!confirm('Mark this settlement as completed?')) return;

    this.settlementService.completeSettlement(settlementId).subscribe({
      error: (error: any) => {
        console.error('Error completing settlement:', error);
        alert(error.error?.message || 'Error completing settlement');
      }
    });
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

  trackByHistoryId(index: number, item: SettlementHistory): string {
    return item.id || index.toString();
  }

  trackByGroupId(index: number, group: any): string {
    return group._id || index.toString();
  }

  trackByMemberEmail(index: number, member: any): string {
    return member.email || index.toString();
  }
}
