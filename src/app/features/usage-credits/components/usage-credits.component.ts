import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';
import {
  UsageCreditsApiResponse,
  UsageCreditsPaginationMeta,
  UsageCreditsPlanFilter,
  UsageCreditsRangeFilter,
  UsageCreditsRecord,
  UsageCreditsService,
} from '../services/usage-credits.service';

type UsageCreditsRow = Record<string, unknown>;

interface UsageCreditsFilters {
  search: string;
  usageFrom: string;
  usageTo: string;
  plan: UsageCreditsPlanFilter;
  creditRange: UsageCreditsRangeFilter;
}

@Component({
  selector: 'app-usage-credits',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiTableComponent],
  templateUrl: './usage-credits.component.html',
  styleUrls: ['./usage-credits.component.scss'],
})
export class UsageCreditsComponent implements OnInit {
  readonly columns = ['S.No.', 'User', 'Plan Name', 'Credits Given', 'Credits Used', 'Remaining'];
  readonly exportColumns = ['S.No.', 'User', 'Plan Name', 'Credits Given', 'Credits Used', 'Remaining'];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  rows: UsageCreditsRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;

  filters: UsageCreditsFilters = {
    search: '',
    usageFrom: '',
    usageTo: '',
    plan: 'all',
    creditRange: 'all',
  };

  constructor(
    private readonly usageCreditsService: UsageCreditsService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadUsageCredits(1);
    });

    this.loadUsageCredits();
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

  onFilterChange(): void {
    this.loadUsageCredits(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }

    this.loadUsageCredits(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }

    this.loadUsageCredits(this.currentPage + 1);
  }

  exportCsv(): void {
    if (!this.rows.length) {
      this.notificationService.warning('No usage credits data available to export.');
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
    link.download = `usage-credits-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadUsageCredits(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (this.filters.usageFrom && this.filters.usageTo && this.filters.usageFrom > this.filters.usageTo) {
      this.notificationService.warning('Usage From date cannot be later than Usage To date.');
      return;
    }

    this.loading = true;

    this.usageCreditsService
      .fetchUsageCreditsByAdmin({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        usage_from: this.filters.usageFrom,
        usage_to: this.filters.usageTo,
        plan: this.filters.plan,
        credit_range: this.filters.creditRange,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load usage credits.');
            this.stopLoading();
            return;
          }

          const usageCredits = this.extractUsageCredits(response);
          const pagination = this.extractPagination(response, usageCredits.length, page);

          this.rows = usageCredits.map((record, index) => this.mapUsageCreditsRow(record, index, pagination.page));
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

  private extractUsageCredits(response: UsageCreditsApiResponse): UsageCreditsRecord[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload as UsageCreditsRecord[];
    }

    if (payload && typeof payload === 'object') {
      const candidates = [
        (payload as { usageCredits?: unknown }).usageCredits,
        (payload as { items?: unknown }).items,
        (payload as { rows?: unknown }).rows,
        (payload as { records?: unknown }).records,
      ];

      const matchingArray = candidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray as UsageCreditsRecord[];
      }
    }

    return [];
  }

  private extractPagination(
    response: UsageCreditsApiResponse,
    itemCount: number,
    requestedPage: number,
  ): Required<UsageCreditsPaginationMeta> {
    const dataPagination = this.pickPaginationObject(response.data);
    const rootPagination =
      this.pickPaginationObject(response.pagination) || this.pickPaginationObject(response.meta);
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

  private pickPaginationObject(value: unknown): UsageCreditsPaginationMeta | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate as UsageCreditsPaginationMeta;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value as UsageCreditsPaginationMeta;
    }

    return null;
  }

  private mapUsageCreditsRow(record: UsageCreditsRecord, index: number, page: number): UsageCreditsRow {
    return {
      'S.No.': (page - 1) * this.pageSize + index + 1,
      User: record.user || 'N/A',
      'Plan Name': record.plan_name || 'N/A',
      'Credits Given': this.formatCredits(record.credits_given),
      'Credits Used': this.formatCredits(record.credits_used),
      Remaining: this.formatCredits(record.remaining),
    };
  }

  private formatCredits(value: number | string | null | undefined): string {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return '0';
    }

    return new Intl.NumberFormat('en-IN').format(numeric);
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
