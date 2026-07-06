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
  remainingCredits = 0;
  totalProjects = 0;
  totalDrafts = 0;
  totalDeploys = 0;
  loading = false;

  transactions = [
    { dateTime: '2026-05-06 10:11', type: 'Plan Renew', plan: 'Standard Plan', credits: 5000, paymentMode: 'UPI', detail: 'Monthly renewal' },
    { dateTime: '2026-05-06 10:04', type: 'Build Cost', plan: 'Standard Plan', credits: -120, paymentMode: 'N/A', detail: 'Deploy: Brand Studio' },
    { dateTime: '2026-05-05 19:36', type: 'AI Usage', plan: 'Standard Plan', credits: -40, paymentMode: 'N/A', detail: 'Landing page generation' },
    { dateTime: '2026-05-04 08:21', type: 'Top Up', plan: 'Standard Plan', credits: 2000, paymentMode: 'Card', detail: 'Manual admin credit add' },
  ];

  projectHistory = [
    { id: 1, projectId: 'PRJ-2231', projectName: 'Brand Studio', type: 'Deploy', dateTime: '2026-05-06 10:04', status: 'Success' },
    { id: 2, projectId: 'PRJ-2230', projectName: 'Pricing Engine', type: 'Draft', dateTime: '2026-05-06 09:42', status: 'Draft Saved' },
    { id: 3, projectId: 'PRJ-2198', projectName: 'SalesOps AI', type: 'Deploy', dateTime: '2026-05-05 14:16', status: 'Failed' },
  ];

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

    const fallbackMap: Record<string, boolean> = {
      'aarav-malhotra': true,
      'ira-singh': true,
      'rohan-das': true
    };

    if (!fallbackMap[this.userId]) {
      this.transactions = [];
      this.projectHistory = [];
    }

    this.loadUserDetails();
  }

  loadUserDetails(): void {
    const fallbackMap: Record<string, { name: string; phone: string; email: string; plan: string; credits: number; projects: number; drafts: number; deploys: number }> = {
      'aarav-malhotra': { name: 'Aarav Malhotra', phone: '+91 98765 12121', email: 'aarav@creativeai.com', plan: 'Standard Plan', credits: 18770, projects: 8, drafts: 3, deploys: 5 },
      'ira-singh': { name: 'Ira Singh', phone: '+91 98220 44331', email: 'ira@creativeai.com', plan: 'Free Plan', credits: 8100, projects: 5, drafts: 2, deploys: 3 },
      'rohan-das': { name: 'Rohan Das', phone: '+91 98901 56789', email: 'rohan@creativeai.com', plan: 'Enterprise Plan', credits: 15800, projects: 12, drafts: 4, deploys: 8 },
    };

    if (fallbackMap[this.userId]) {
      const data = fallbackMap[this.userId];
      this.userName = data.name;
      this.phone = data.phone;
      this.email = data.email;
      this.currentPlan = data.plan;
      this.remainingCredits = data.credits;
      this.totalProjects = data.projects;
      this.totalDrafts = data.drafts;
      this.totalDeploys = data.deploys;
      return;
    }

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
          this.userName = summary.name || summary.displayName || summary.username || summary.email || 'N/A';
          this.phone = summary.full_phone || summary.phoneNumber || summary.phone || 'N/A';
          this.email = summary.email || 'N/A';
          this.currentPlan = summary.current_plan || summary.plan || summary.current_subscription_plan_name || 'Free Plan';
          this.remainingCredits = typeof summary.remaining_credits !== 'undefined' ? Number(summary.remaining_credits) :
            typeof summary.creditsRemaining !== 'undefined' ? Number(summary.creditsRemaining) : 0;
          this.totalProjects = typeof summary.total_projects !== 'undefined' ? Number(summary.total_projects) :
            typeof summary.totalProjects !== 'undefined' ? Number(summary.totalProjects) : 0;
          this.totalDrafts = typeof summary.drafts !== 'undefined' ? Number(summary.drafts) :
            typeof summary.total_drafts !== 'undefined' ? Number(summary.total_drafts) : 0;
          this.totalDeploys = typeof summary.deploys !== 'undefined' ? Number(summary.deploys) :
            typeof summary.total_deploys !== 'undefined' ? Number(summary.total_deploys) : 0;

          const txHistory = data.transaction_history || data.transactions;
          if (Array.isArray(txHistory) && txHistory.length > 0) {
            this.transactions = txHistory.map((tx: any) => ({
              dateTime: this.formatDateTime(tx.date_time || tx.dateTime || tx.createdAt || tx.created_at),
              type: tx.type || 'N/A',
              plan: tx.plan || tx.plan_name || 'N/A',
              credits: typeof tx.credits !== 'undefined' ? Number(tx.credits) : 0,
              paymentMode: tx.payment_mode || tx.paymentMode || 'N/A',
              detail: tx.detail || tx.details || 'N/A',
            }));
          }

          const projHistory = data.project_history || data.projects;
          if (Array.isArray(projHistory) && projHistory.length > 0) {
            this.projectHistory = projHistory.map((p: any) => ({
              id: p.id,
              projectId: p.project_id || p.projectId || p.id || 'N/A',
              projectName: p.project || p.projectName || p.name || 'N/A',
              type: p.type || 'N/A',
              dateTime: this.formatDateTime(p.date_time || p.dateTime || p.createdAt || p.created_at),
              status: p.status || 'N/A',
            }));
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
}
