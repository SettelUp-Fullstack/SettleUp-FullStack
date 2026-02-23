import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService, Group } from '../../services/group.service';
import { Subscription } from 'rxjs';

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

  constructor(private groupService: GroupService) {}

  ngOnInit() {
    console.log('GroupsComponent - Initializing');
    
    this.subscriptions.push(
      this.groupService.groups$.subscribe(groups => {
        console.log('GroupsComponent - Groups updated:', groups?.length);
        this.groups = groups || [];
      })
    );

    this.subscriptions.push(
      this.groupService.loading$.subscribe(loading => {
        console.log('GroupsComponent - Loading state:', loading);
        this.isLoading = loading;
      })
    );

    this.loadGroups();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadGroups() {
    console.log('GroupsComponent - Loading groups');
    this.groupService.fetchGroups().subscribe({
      error: (error) => {
        console.error('Error loading groups:', error);
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
        console.log('Group created successfully');
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
      next: () => {
        console.log('Group deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting group:', error);
        alert(error.error?.message || 'Error deleting group');
      }
    });
  }

  getMemberCount(group: Group): number {
    return group.members?.length || 0;
  }

  trackByGroupId(index: number, group: Group): string {
    return group._id;
  }
}