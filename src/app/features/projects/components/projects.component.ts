import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';
import {
  ProjectRecord,
  ProjectsApiResponse,
  ProjectsPaginationMeta,
  ProjectsService,
  ProjectStatusFilter,
} from '../services/projects.service';

type ProjectRow = Record<string, string | number>;

interface ProjectFilters {
  search: string;
  createdFrom: string;
  createdTo: string;
  status: ProjectStatusFilter;
  user: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiButtonComponent, UiTableComponent],
  providers: [DatePipe],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  readonly columns = ['S.No.', 'Project Name', 'User', 'Status', 'Model Used', 'Created Date', 'Action'];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  rows: ProjectRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;

  filters: ProjectFilters = {
    search: '',
    createdFrom: '',
    createdTo: '',
    status: 'all',
    user: '',
  };

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadProjects(1);
    });

    this.loadProjects();
  }

  get hasRows(): boolean {
    return this.rows.length > 0;
  }

  get showingFrom(): number {
    if (!this.totalItems) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    if (!this.totalItems) {
      return 0;
    }

    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  onSearchChange(value: string): void {
    this.filters.search = value;
    this.textFilterChanges$.next();
  }

  onUserChange(value: string): void {
    this.filters.user = value;
    this.textFilterChanges$.next();
  }

  onFilterChange(): void {
    this.loadProjects(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }

    this.loadProjects(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }

    this.loadProjects(this.currentPage + 1);
  }

  exportCsv(): void {
    if (!this.rows.length) {
      this.notificationService.warning('No projects available to export.');
      return;
    }

    const headers = this.columns.join(',');
    const dataRows = this.rows.map((row) =>
      this.columns
        .map((column) => `"${String(row[column] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );

    const csvContent = [headers, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  openProjectDetails(row: ProjectRow): void {
    const inquiryId = row['InquiryId'];
    if (!inquiryId) {
      this.notificationService.warning('Project details are not available for this record.');
      return;
    }

    void this.router.navigate(['/projects', inquiryId]);
  }

  private loadProjects(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (
      this.filters.createdFrom &&
      this.filters.createdTo &&
      this.filters.createdFrom > this.filters.createdTo
    ) {
      this.notificationService.warning('Created From date cannot be later than Created To date.');
      return;
    }

    this.loading = true;

    this.projectsService
      .fetchProjectsByUser({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        user: this.filters.user,
        status: this.filters.status,
        createdFrom: this.filters.createdFrom,
        createdTo: this.filters.createdTo,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load projects.');
            this.stopLoading();
            return;
          }

          const projects = this.extractProjects(response);
          const pagination = this.extractPagination(response, projects.length, page);

          this.currentPage = pagination.page;
          this.rows = projects.map((project, index) => this.mapProjectRow(project, index));
          this.totalItems = pagination.total;
          this.totalPages = pagination.totalPages;
          this.stopLoading();
        },
        error: () => {
          this.rows = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.stopLoading();
        },
      });
  }

  private extractProjects(response: ProjectsApiResponse): ProjectRecord[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload as ProjectRecord[];
    }

    if (payload && typeof payload === 'object') {
      const projectCandidates = [
        (payload as { projects?: unknown }).projects,
        (payload as { items?: unknown }).items,
        (payload as { rows?: unknown }).rows,
        (payload as { data?: unknown }).data,
        (payload as { records?: unknown }).records,
      ];

      const matchingArray = projectCandidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray as ProjectRecord[];
      }
    }

    return [];
  }

  private extractPagination(
    response: ProjectsApiResponse,
    itemCount: number,
    requestedPage: number,
  ): Required<ProjectsPaginationMeta> {
    const dataPagination = this.pickPaginationObject(response.data);
    const rootPagination = this.pickPaginationObject(response.pagination) || this.pickPaginationObject(response.meta);
    const pagination = dataPagination || rootPagination || {};

    const total =
      this.toPositiveNumber(pagination.total) ??
      this.toPositiveNumber(response.total) ??
      this.toPositiveNumber(response.totalRecords) ??
      (requestedPage > 1 ? (requestedPage - 1) * this.pageSize + itemCount : itemCount);

    const limit = this.toPositiveNumber(pagination.limit) ?? this.toPositiveNumber(response.limit) ?? this.pageSize;
    const totalPages =
      this.toPositiveNumber(pagination.totalPages) ??
      this.toPositiveNumber(response.totalPages) ??
      Math.max(1, Math.ceil(total / limit));
    const page = this.toPositiveNumber(pagination.page) ?? this.toPositiveNumber(response.page) ?? requestedPage;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  private pickPaginationObject(value: unknown): ProjectsPaginationMeta | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate as ProjectsPaginationMeta;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value as ProjectsPaginationMeta;
    }

    return null;
  }

  private mapProjectRow(project: ProjectRecord, index: number): ProjectRow {
    const status = this.formatProjectStatus(project.build_status);

    return {
      'S.No.': (this.currentPage - 1) * this.pageSize + index + 1,
      InquiryId: project.id || '',
      'Project Name': project.clientProjectName || 'N/A',
      User: project.name || 'N/A',
      Status: status,
      StatusTone: this.getProjectStatusTone(status),
      'Model Used': project.ai_model || 'N/A',
      'Created Date': this.formatDateTime(project.createdAt),
      Action: 'View',
    };
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
        return 'Failed';
      case 1:
        return 'Success';
      case 2:
        return 'Pending';
      default:
        return String(status);
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

  private formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }

    return this.datePipe.transform(value, 'dd MMM yyyy, hh:mm a') || value;
  }

  private toPositiveNumber(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private getProjectStatusTone(status: string): string {
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
