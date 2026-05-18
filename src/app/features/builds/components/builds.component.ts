import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';
import {
  BuildRecord,
  BuildsApiResponse,
  BuildsPaginationMeta,
  BuildsService,
  BuildStatusFilter,
} from '../services/builds.service';

type BuildRow = Record<string, string | number>;

interface BuildFilters {
  search: string;
  from: string;
  to: string;
  status: BuildStatusFilter;
  project: string;
}

@Component({
  selector: 'app-builds',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiTableComponent],
  providers: [DatePipe],
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss'],
})
export class BuildsComponent implements OnInit {
  readonly columns = ['Build ID', 'User', 'Project', 'Status', 'Time Taken', 'Credits Used', 'Timestamp'];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  rows: BuildRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;

  filters: BuildFilters = {
    search: '',
    from: '',
    to: '',
    status: 'all',
    project: '',
  };

  constructor(
    private readonly buildsService: BuildsService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadBuilds(1);
    });

    this.loadBuilds();
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

  onProjectChange(value: string): void {
    this.filters.project = value;
    this.textFilterChanges$.next();
  }

  onFilterChange(): void {
    this.loadBuilds(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }

    this.loadBuilds(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }

    this.loadBuilds(this.currentPage + 1);
  }

  exportCsv(): void {
    if (!this.rows.length) {
      this.notificationService.warning('No builds available to export.');
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
    link.download = `builds-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadBuilds(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (this.filters.from && this.filters.to && this.filters.from > this.filters.to) {
      this.notificationService.warning('From date cannot be later than To date.');
      return;
    }

    this.loading = true;

    this.buildsService
      .fetchBuildsByAdmin({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        from: this.filters.from,
        to: this.filters.to,
        status: this.filters.status,
        project: this.filters.project,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load builds.');
            this.stopLoading();
            return;
          }

          const builds = this.extractBuilds(response);
          const pagination = this.extractPagination(response, builds.length, page);

          this.rows = builds.map((build) => this.mapBuildRow(build));
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

  private extractBuilds(response: BuildsApiResponse): BuildRecord[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload as BuildRecord[];
    }

    if (payload && typeof payload === 'object') {
      const buildCandidates = [
        (payload as { builds?: unknown }).builds,
        (payload as { items?: unknown }).items,
        (payload as { rows?: unknown }).rows,
        (payload as { records?: unknown }).records,
      ];

      const matchingArray = buildCandidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray as BuildRecord[];
      }
    }

    return [];
  }

  private extractPagination(
    response: BuildsApiResponse,
    itemCount: number,
    requestedPage: number,
  ): Required<BuildsPaginationMeta> {
    const dataPagination = this.pickPaginationObject(response.data);
    const rootPagination = this.pickPaginationObject(response.pagination) || this.pickPaginationObject(response.meta);
    const pagination = dataPagination || rootPagination || {};

    const total =
      this.toPositiveNumber(pagination.total) ??
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

  private pickPaginationObject(value: unknown): BuildsPaginationMeta | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate as BuildsPaginationMeta;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value as BuildsPaginationMeta;
    }

    return null;
  }

  private mapBuildRow(build: BuildRecord): BuildRow {
    return {
      'Build ID': build.build_id || 'N/A',
      User: build.user || 'N/A',
      Project: build.project || 'N/A',
      Status: this.formatStatus(build.status),
      'Time Taken': build.time_taken || 'N/A',
      'Credits Used': this.formatCredits(build.credits_used),
      Timestamp: this.formatDateTime(build.timestamp),
    };
  }

  private formatStatus(status: string | null | undefined): string {
    if (!status) {
      return 'N/A';
    }

    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  private formatCredits(value: number | string | null | undefined): string {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return '0';
    }

    return new Intl.NumberFormat('en-IN').format(numeric);
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
