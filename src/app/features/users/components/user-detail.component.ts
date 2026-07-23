import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  activeTab: 'transactions' | 'projects' = 'transactions';
  userId = '';
  userName = '';
  phone = '';
  email = '';
  currentPlan = '';
  remainingCredits: number | null = null;
  totalProjects: number | null = null;
  totalDrafts: number | null = null;
  totalDeploys: number | null = null;
  loading = false;

  transactions: { dateTime: string; type: string; plan: string; credits: number; paymentMode: string; detail: string; }[] = [];
  projectHistory: { id: any; projectId: string; projectName: string; type: string; dateTime: string; build_status: string; }[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) { }

  setTab(tab: 'transactions' | 'projects'): void {
    this.activeTab = tab;
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.userId) {
      this.notificationService.error('User ID is missing.');
      return;
    }

    this.loadUserDetails();
  }

  loadUserDetails(): void {
    this.loading = true;
    this.usersService.getUserDetailsById(this.userId).subscribe({
      next: (response) => {
        if (response && response.success === false) {
          this.notificationService.error(response.message || 'Failed to load user details.');
          this.stopLoading();
          return;
        }

        const data = response?.data || response;
        if (data) {
          const summary = data.summary || data;
          this.userName = this.cleanField(summary.name || summary.displayName || summary.username || summary.email);
          this.phone = this.cleanField(summary.full_phone || summary.phoneNumber || summary.phone || summary.mobile);
          this.email = this.cleanField(summary.email);
          this.currentPlan = this.cleanField(summary.current_plan || summary.plan || summary.current_subscription_plan_name);
          this.remainingCredits = typeof summary.remaining_credits !== 'undefined' && summary.remaining_credits !== null ? Number(summary.remaining_credits) :
            typeof summary.creditsRemaining !== 'undefined' && summary.creditsRemaining !== null ? Number(summary.creditsRemaining) : null;
          this.totalProjects = typeof summary.total_projects !== 'undefined' && summary.total_projects !== null ? Number(summary.total_projects) :
            typeof summary.totalProjects !== 'undefined' && summary.totalProjects !== null ? Number(summary.totalProjects) : null;
          this.totalDrafts = typeof summary.drafts !== 'undefined' && summary.drafts !== null ? Number(summary.drafts) :
            typeof summary.total_drafts !== 'undefined' && summary.total_drafts !== null ? Number(summary.total_drafts) : null;
          this.totalDeploys = typeof summary.deploys !== 'undefined' && summary.deploys !== null ? Number(summary.deploys) :
            typeof summary.total_deploys !== 'undefined' && summary.total_deploys !== null ? Number(summary.total_deploys) : null;

          const txHistory = data.transaction_history || data.transactions;
          if (Array.isArray(txHistory)) {
            this.transactions = txHistory.map((tx: any) => ({
              dateTime: this.formatDateTime(tx.date_time || tx.dateTime || tx.createdAt || tx.created_at),
              type: tx.type || 'N/A',
              plan: tx.plan || tx.plan_name || 'N/A',
              credits: typeof tx.credits !== 'undefined' ? Number(tx.credits) : 0,
              paymentMode: tx.payment_mode || tx.paymentMode || 'N/A',
              detail: tx.detail || tx.details || 'N/A',
            }));
          } else {
            this.transactions = [];
          }

          const projHistory = data.project_history || data.projects;
          if (Array.isArray(projHistory)) {
            this.projectHistory = projHistory.map((p: any) => ({
              id: p.id,
              projectId: p.project_id || p.projectId || p.id || 'N/A',
              projectName: p.project || p.projectName || p.name || 'N/A',
              type: p.type || 'N/A',
              dateTime: this.formatDateTime(p.date_time || p.dateTime || p.createdAt || p.created_at),
              build_status: p.build_status == 1 ? 'Success' : 'Failed',
            }));
          } else {
            this.projectHistory = [];
          }
        }
        this.stopLoading();
      },
      error: () => {
        this.stopLoading();
        this.notificationService.error('Error fetching user details.');
      }
    });
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private formatDateTime(rawDate: string): string {
    if (!rawDate || rawDate === 'N/A') return 'N/A';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return rawDate;
    }
  }

  openProjectDetails(id: any): void {
    if (!id) {
      this.notificationService.warning('Project details are not available for this record.');
      return;
    }

    void this.router.navigate(['/projects', id]);
  }

  private cleanField(value: any, fallback = 'N/A'): string {
    if (value === null || value === undefined) {
      return fallback;
    }
    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
      return fallback;
    }
    return str;
  }

  getProjectStatusTone(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return 'success';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      default:
        return '';
    }
  }
}
