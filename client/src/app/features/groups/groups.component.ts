import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService, Group } from '../../services/group.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit, OnDestroy {
  groups: Group[] = [];
  showModal = false;
  isLoading = false;

  newGroup: any = {
    name: '',
    type: '',
    members: []
  };

  newMember: any = {
    name: '',
    email: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private groupService: GroupService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Skip data loading during SSR
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      return;
    }

    this.subscriptions.push(
      this.groupService.groups$.subscribe(groups => {
        this.groups = groups || [];
        // Ensure loading is hidden when data arrives
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.push(
      this.groupService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      })
    );

    this.loadGroups();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadGroups() {
    this.groupService.fetchGroups().subscribe({
      error: (error) => {
        console.error('Error loading groups:', error);
        this.isLoading = false;
      }
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
    this.newGroup = {
      name: '',
      type: '',
      members: []
    };
    this.newMember = {
      name: '',
      email: ''
    };
  }

  isValidMember(): boolean {
    return this.newMember.name.trim() !== '' && 
           this.newMember.email.trim() !== '' && 
           this.newMember.email.includes('@');
  }

  addMember() {
    if (this.isValidMember()) {
      this.newGroup.members.push({
        name: this.newMember.name.trim(),
        email: this.newMember.email.trim()
      });
      this.newMember = { name: '', email: '' };
    }
  }

  removeMember(index: number) {
    this.newGroup.members.splice(index, 1);
  }

  isValidGroup(): boolean {
    return this.newGroup.name.trim() !== '' && 
           this.newGroup.type !== '' && 
           this.newGroup.members.length > 0;
  }

  createGroup() {
    if (!this.isValidGroup()) {
      alert('Please fill all fields and add at least one member');
      return;
    }

    this.groupService.createGroup(this.newGroup).subscribe({
      next: () => {
        this.closeModal();
      },
      error: (error) => {
        console.error('Error creating group:', error);
        alert(error.error?.message || 'Error creating group');
      }
    });
  }

  deleteGroup(groupId: string) {
    if (!groupId) return;
    
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    this.groupService.deleteGroup(groupId).subscribe({
      error: (error) => {
        console.error('Error deleting group:', error);
        alert(error.error?.message || 'Error deleting group');
      }
    });
  }

  trackByGroupId(index: number, group: Group): string {
    return group._id;
  }

  trackByMember(index: number, member: { email: string }): string {
    return member.email || index.toString();
  }
}
