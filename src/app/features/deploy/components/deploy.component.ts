import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent, UiModalComponent, UiTableComponent } from '../../../shared/components';
import {
  DeployApiResponse,
  DeployPaginationMeta,
  DeployRecord,
  DeployService,
  DeployStatusFilter,
} from '../services/deploy.service';

type DeployRow = Record<string, unknown>;

interface DeployFilters {
  search: string;
  requestedFrom: string;
  requestedTo: string;
  status: DeployStatusFilter;
  user: string;
}

@Component({
  selector: 'app-deploy',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiModalComponent, UiTableComponent],
  providers: [DatePipe],
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss'],
})
export class DeployComponent implements OnInit {
  readonly columns = ['S.No.', 'User', 'Project Name', 'Domain', 'Environment', 'Requested At', 'Status', 'Action'];
  readonly exportColumns = ['S.No.', 'User', 'Project ID', 'Project Name', 'Domain', 'Environment', 'Requested At', 'Status'];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  rows: DeployRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;
  selectedDeployRequest: DeployRecord | null = null;

  filters: DeployFilters = {
    search: '',
    requestedFrom: '',
    requestedTo: '',
    status: 'all',
    user: '',
  };

  constructor(
    private readonly deployService: DeployService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadDeployRequests(1);
    });

    this.loadDeployRequests();
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
    this.loadDeployRequests(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }

    this.loadDeployRequests(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }

    this.loadDeployRequests(this.currentPage + 1);
  }

  openDeployRequestDetails(row: DeployRow): void {
    this.selectedDeployRequest = (row['__raw'] as DeployRecord | undefined) || null;
  }

  closeDeployRequestDetails(): void {
    this.selectedDeployRequest = null;
  }

  exportCsv(): void {
    if (!this.rows.length) {
      this.notificationService.warning('No deploy requests available to export.');
      return;
    }

    const headers = this.exportColumns.join(',');
    const dataRows = this.rows.map((row) =>
      this.exportColumns
        .map((column) => `"${String(row[column] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );

    const csvContent = [headers, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deploy-requests-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadDeployRequests(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (
      this.filters.requestedFrom &&
      this.filters.requestedTo &&
      this.filters.requestedFrom > this.filters.requestedTo
    ) {
      this.notificationService.warning('Requested From date cannot be later than Requested To date.');
      return;
    }

    this.loading = true;

    this.deployService
      .fetchDeployRequestsByAdmin({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        requested_from: this.filters.requestedFrom,
        requested_to: this.filters.requestedTo,
        status: this.filters.status,
        user: this.filters.user,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load deploy requests.');
            this.stopLoading();
            return;
          }

          const deployRequests = this.extractDeployRequests(response);
          const pagination = this.extractPagination(response, deployRequests.length, page);

          this.rows = deployRequests.map((request, index) => this.mapDeployRow(request, index, pagination.page));
          this.currentPage = pagination.page;
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

  private extractDeployRequests(response: DeployApiResponse): DeployRecord[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload as DeployRecord[];
    }

    if (payload && typeof payload === 'object') {
      const deployCandidates = [
        (payload as { deployRequests?: unknown }).deployRequests,
        (payload as { requests?: unknown }).requests,
        (payload as { items?: unknown }).items,
        (payload as { rows?: unknown }).rows,
        (payload as { records?: unknown }).records,
      ];

      const matchingArray = deployCandidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray as DeployRecord[];
      }
    }

    return [];
  }

  private extractPagination(
    response: DeployApiResponse,
    itemCount: number,
    requestedPage: number,
  ): Required<DeployPaginationMeta> {
    const dataPagination = this.pickPaginationObject(response.data);
    const rootPagination = this.pickPaginationObject(response.pagination) || this.pickPaginationObject(response.meta);
    const pagination = dataPagination || rootPagination || {};

    const total =
      this.toPositiveNumber(pagination.total) ??
      this.toPositiveNumber(response.totalRecords) ??
      this.toPositiveNumber(response.total) ??
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

  private pickPaginationObject(value: unknown): DeployPaginationMeta | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate as DeployPaginationMeta;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value as DeployPaginationMeta;
    }

    return null;
  }

  private mapDeployRow(request: DeployRecord, index: number, page: number): DeployRow {
    return {
      'S.No.': (page - 1) * this.pageSize + index + 1,
      User: request.user || 'N/A',
      'Project ID': request.project_id || 'N/A',
      'Project Name': request.project_name || 'N/A',
      Domain: request.domain || 'N/A',
      Environment: request.environment || 'N/A',
      'Requested At': this.formatDateTime(request.requested_at),
      Status: this.formatStatus(request.status),
      Action: 'View',
      __raw: request,
    };
  }

  private formatStatus(status: string | null | undefined): string {
    if (!status) {
      return 'N/A';
    }

    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  private formatDateTime(value: string): string {
    return this.datePipe.transform(value, 'dd MMM yyyy, hh:mm a') || value || 'N/A';
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
}
