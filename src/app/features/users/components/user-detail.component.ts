import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

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

  transactions = [
    { dateTime: '2026-05-06 10:11', type: 'Plan Renew', plan: 'Standard Plan', credits: 5000, paymentMode: 'UPI', detail: 'Monthly renewal' },
    { dateTime: '2026-05-06 10:04', type: 'Build Cost', plan: 'Standard Plan', credits: -120, paymentMode: 'N/A', detail: 'Deploy: Brand Studio' },
    { dateTime: '2026-05-05 19:36', type: 'AI Usage', plan: 'Standard Plan', credits: -40, paymentMode: 'N/A', detail: 'Landing page generation' },
    { dateTime: '2026-05-04 08:21', type: 'Top Up', plan: 'Standard Plan', credits: 2000, paymentMode: 'Card', detail: 'Manual admin credit add' },
  ];

  projectHistory = [
    { projectId: 'PRJ-2231', projectName: 'Brand Studio', type: 'Deploy', dateTime: '2026-05-06 10:04', status: 'Success' },
    { projectId: 'PRJ-2230', projectName: 'Pricing Engine', type: 'Draft', dateTime: '2026-05-06 09:42', status: 'Draft Saved' },
    { projectId: 'PRJ-2198', projectName: 'SalesOps AI', type: 'Deploy', dateTime: '2026-05-05 14:16', status: 'Failed' },
  ];

  constructor(private readonly route: ActivatedRoute) {}

  setTab(tab: 'transactions' | 'projects'): void {
    this.activeTab = tab;
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';

    const map: Record<string, { name: string; phone: string; email: string; plan: string; credits: number; projects: number; drafts: number; deploys: number }> = {
      'aarav-malhotra': { name: 'Aarav Malhotra', phone: '+91 98765 12121', email: 'aarav@creativeai.com', plan: 'Standard Plan', credits: 18770, projects: 8, drafts: 3, deploys: 5 },
      'ira-singh': { name: 'Ira Singh', phone: '+91 98220 44331', email: 'ira@creativeai.com', plan: 'Free Plan', credits: 8100, projects: 5, drafts: 2, deploys: 3 },
      'rohan-das': { name: 'Rohan Das', phone: '+91 98901 56789', email: 'rohan@creativeai.com', plan: 'Enterprise Plan', credits: 15800, projects: 12, drafts: 4, deploys: 8 },
    };

    const data = map[this.userId] || map['aarav-malhotra'];
    this.userName = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.currentPlan = data.plan;
    this.remainingCredits = data.credits;
    this.totalProjects = data.projects;
    this.totalDrafts = data.drafts;
    this.totalDeploys = data.deploys;
  }
}
