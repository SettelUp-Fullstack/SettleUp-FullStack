import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExpenseService, Expense } from '../../services/expense.service';
import { GroupService } from '../../services/group.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, OnDestroy {
  Math = Math;

  expenses: Expense[] = [];
  userGroups: any[] = [];
  selectedGroup: any = null;
  
  showModal = false;
  isLoading = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  newExpense: any = {
    description: '',
    amount: null,
    category: 'Other',
    group: '',
    paidBy: ''
  };

  splitType: 'equal' | 'exact' = 'equal';
  customSplits: { [key: string]: number } = {};
  
  formErrors: any = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private expenseService: ExpenseService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.expenseService.expenses$.subscribe(expenses => {
        this.expenses = expenses || [];
      })
    );

    this.subscriptions.push(
      this.groupService.groups$.subscribe(groups => {
        this.userGroups = groups || [];
      })
    );

    this.subscriptions.push(
      this.expenseService.loading$.subscribe(loading => {
        this.isLoading = loading;
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

    this.expenseService.fetchExpenses().subscribe({
      error: (error) => console.error('Error loading expenses:', error)
    });
  }

  openModal() {
    this.showModal = true;
    this.resetForm();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.newExpense = {
      description: '',
      amount: null,
      category: 'Other',
      group: '',
      paidBy: ''
    };
    this.selectedGroup = null;
    this.splitType = 'equal';
    this.customSplits = {};
    this.formErrors = {};
    this.errorMessage = null;
  }

  onGroupChange() {
    this.newExpense.paidBy = '';
    this.selectedGroup = this.userGroups.find(g => g._id === this.newExpense.group) || null;
    this.customSplits = {};
    
    if (this.selectedGroup) {
      this.selectedGroup.members.forEach((member: any) => {
        this.customSplits[member.email] = 0;
      });
    }
  }

  getSelectedGroupMembers(): any[] {
    return this.selectedGroup?.members || [];
  }

  getGroupName(groupId: string): string {
    if (!groupId) return 'Unknown Group';
    const group = this.userGroups.find(g => g._id === groupId);
    return group?.name || 'Unknown Group';
  }

  setSplitType(type: 'equal' | 'exact') {
    this.splitType = type;
    if (type === 'equal') {
      this.customSplits = {};
      this.errorMessage = null;
    }
  }

  validateExactSplits() {
    if (!this.newExpense.amount) return;
    
    const total = this.getSplitTotal();
    const expenseAmount = parseFloat(this.newExpense.amount);
    
    if (Math.abs(total - expenseAmount) > 0.01) {
      this.errorMessage = `Total ${total.toFixed(2)} must equal ${expenseAmount.toFixed(2)}`;
    } else {
      this.errorMessage = null;
    }
  }

  getSplitTotal(): number {
    return Object.values(this.customSplits).reduce((sum, val) => sum + (val || 0), 0);
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.newExpense.description?.trim()) {
      this.formErrors.description = 'Description is required';
    }

    if (!this.newExpense.amount || this.newExpense.amount <= 0) {
      this.formErrors.amount = 'Valid amount is required';
    }

    if (!this.newExpense.group) {
      this.formErrors.group = 'Please select a group';
    }

    if (!this.newExpense.paidBy) {
      this.formErrors.paidBy = 'Please select who paid';
    }

    if (this.splitType === 'exact' && this.errorMessage) {
      return false;
    }

    return Object.keys(this.formErrors).length === 0;
  }

  addExpense() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    
    const selectedGroup = this.selectedGroup;
    const splitAmount = this.newExpense.amount / (selectedGroup?.members?.length || 1);

    let splits = [];
    if (this.splitType === 'equal') {
      splits = selectedGroup?.members.map((member: any) => ({
        member: member.email,
        amount: splitAmount
      }));
    } else {
      splits = Object.entries(this.customSplits).map(([email, amount]) => ({
        member: email,
        amount
      }));
    }

    const selectedPayer = selectedGroup?.members.find((m: any) => m.email === this.newExpense.paidBy);

    const expenseData = {
      description: this.newExpense.description,
      amount: parseFloat(this.newExpense.amount),
      category: this.newExpense.category,
      group: this.newExpense.group,
      paidBy: this.newExpense.paidBy,
      paidByName: selectedPayer?.name,
      splits: splits,
      date: new Date()
    };

    this.expenseService.createExpense(expenseData).subscribe({
      next: () => {
        this.closeModal();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating expense:', error);
        this.errorMessage = error.error?.message || 'Error creating expense';
        this.isSubmitting = false;
      }
    });
  }

  deleteExpense(expenseId?: string) {
    if (!expenseId) return;
    
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    this.expenseService.deleteExpense(expenseId).subscribe({
      error: (error) => {
        console.error('Error deleting expense:', error);
        alert(error.error?.message || 'Error deleting expense');
      }
    });
  }

  getCategoryClass(category: string): string {
    return category ? category.toLowerCase() : 'other';
  }

  trackByExpenseId(index: number, expense: Expense): string {
    return expense._id || index.toString();
  }

  trackByGroupId(index: number, group: any): string {
    return group._id || index.toString();
  }

  trackByMemberEmail(index: number, member: any): string {
    return member.email || index.toString();
  }
}
