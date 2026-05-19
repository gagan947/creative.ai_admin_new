import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import {
  ProjectDetailRecord,
  ProjectTemplateRecord,
  ProjectsService,
} from '../services/projects.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [DatePipe],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit {
  inquiryId = '';
  project: ProjectDetailRecord | null = null;
  loading = false;
  expandedErrors: Record<string, boolean> = {};
  expandedAttemptGroups: Record<string, boolean> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly projectsService: ProjectsService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.inquiryId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.inquiryId) {
      this.notificationService.warning('Project ID is missing.');
      return;
    }

    this.loadProjectDetails();
  }

  get templates(): ProjectTemplateRecord[] {
    return this.project?.templates || [];
  }

  get projectStatus(): string {
    return this.formatProjectStatus(this.project?.projectStatus);
  }

  get projectStatusTone(): string {
    return this.getProjectStatusTone(this.projectStatus);
  }

  get buildStatus(): string {
    return this.formatBuildStatus(this.project?.build_status);
  }

  get buildStatusTone(): string {
    return this.getBuildStatusTone(this.buildStatus);
  }

  get deploymentStatus(): string {
    return this.formatDeployment(this.project?.project_deployed);
  }

  formatTemplateBuildStatus(status: number | string | null | undefined): string {
    return this.formatBuildStatus(status);
  }

  getTemplateBuildStatusTone(status: number | string | null | undefined): string {
    return this.getBuildStatusTone(this.formatBuildStatus(status));
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }

    const normalized = value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
    return this.datePipe.transform(normalized, 'dd MMM yyyy, hh:mm a') || value;
  }

  trackByTemplate(index: number, template: ProjectTemplateRecord): string {
    return template.public_template_id || String(index);
  }

  getVisibleErrors(template: ProjectTemplateRecord) {
    const errors = template.error_reports || [];
    return this.areAllAttemptsVisible(template) ? errors : errors.slice(0, 1);
  }

  areAllAttemptsVisible(template: ProjectTemplateRecord): boolean {
    return !!this.expandedAttemptGroups[this.getTemplateKey(template)];
  }

  toggleAllAttempts(template: ProjectTemplateRecord): void {
    const key = this.getTemplateKey(template);
    this.expandedAttemptGroups[key] = !this.expandedAttemptGroups[key];
  }

  getErrorMessage(template: ProjectTemplateRecord, errorIndex: number): string {
    const errorMessage = template.error_reports?.[errorIndex]?.error_messages || '';
    if (!errorMessage) {
      return 'N/A';
    }

    return this.isErrorExpanded(template, errorIndex) ? errorMessage : this.truncateError(errorMessage);
  }

  hasLongErrorMessage(template: ProjectTemplateRecord, errorIndex: number): boolean {
    const errorMessage = template.error_reports?.[errorIndex]?.error_messages || '';
    return errorMessage.length > 320;
  }

  isErrorExpanded(template: ProjectTemplateRecord, errorIndex: number): boolean {
    return !!this.expandedErrors[this.getErrorKey(template, errorIndex)];
  }

  toggleErrorExpansion(template: ProjectTemplateRecord, errorIndex: number): void {
    const key = this.getErrorKey(template, errorIndex);
    this.expandedErrors[key] = !this.expandedErrors[key];
  }

  private loadProjectDetails(): void {
    this.loading = true;

    this.projectsService.fetchTemplateByInquieryId(this.inquiryId).subscribe({
      next: (response) => {
        if (response.success === false || !response.data) {
          this.project = null;
          this.stopLoading();
          this.notificationService.error(response.message || 'Unable to load project details.');
          return;
        }

        this.project = response.data;
        this.stopLoading();
      },
      error: () => {
        this.project = null;
        this.stopLoading();
      },
    });
  }

  private formatProjectStatus(status: number | string | null | undefined): string {
    if (status === null || status === undefined || status === '') {
      return 'N/A';
    }

    if (typeof status === 'string') {
      const normalized = status.trim();
      return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase() : 'N/A';
    }

    switch (status) {
      case 0:
        return 'Archived';
      case 1:
        return 'Active';
      case 2:
        return 'Draft';
      default:
        return String(status);
    }
  }

  private getProjectStatusTone(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'draft':
        return 'pending';
      case 'archived':
        return 'failed';
      default:
        return '';
    }
  }

  private formatBuildStatus(status: number | string | null | undefined): string {
    if (status === null || status === undefined || status === '') {
      return 'N/A';
    }

    if (typeof status === 'string') {
      const normalized = status.trim();
      return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase() : 'N/A';
    }

    switch (status) {
      case 0:
        return 'Failed';
      case 1:
        return 'Success';
      case 2:
        return 'Pending';
      default:
        return String(status);
    }
  }

  private getBuildStatusTone(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return 'success';
      case 'failed':
        return 'failed';
      case 'pending':
        return 'pending';
      default:
        return '';
    }
  }

  private formatDeployment(value: number | boolean | null | undefined): string {
    if (value === true || value === 1) {
      return 'Deployed';
    }

    if (value === false || value === 0) {
      return 'Not Deployed';
    }

    return 'N/A';
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private truncateError(value: string): string {
    return value.length > 320 ? `${value.slice(0, 320).trimEnd()}...` : value;
  }

  private getTemplateKey(template: ProjectTemplateRecord): string {
    return template.public_template_id || `variation-${template.variation_no || '0'}`;
  }

  private getErrorKey(template: ProjectTemplateRecord, errorIndex: number): string {
    return `${this.getTemplateKey(template)}-error-${errorIndex}`;
  }
}
