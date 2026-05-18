import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent, UiModalComponent, UiTableComponent } from '../../../shared/components';
import {
  CallbackPriorityFilter,
  CallbackRequestRecord,
  CallbackRequestsApiResponse,
  CallbackRequestsPaginationMeta,
  CallbackRequestsService,
  CallbackStatusFilter,
} from '../services/callback-requests.service';

type CallbackRequestRow = Record<string, unknown>;

interface CallbackRequestFilters {
  search: string;
  requestFrom: string;
  requestTo: string;
  priority: CallbackPriorityFilter;
  status: CallbackStatusFilter;
}

@Component({
  selector: 'app-callback-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiModalComponent, UiTableComponent],
  providers: [DatePipe],
  templateUrl: './callback-requests.component.html',
  styleUrls: ['./callback-requests.component.scss'],
})
export class CallbackRequestsComponent implements OnInit {
  readonly columns = ['S.No.', 'Name', 'Email', 'Phone', 'Message', 'Requested At', 'Status', 'Action'];
  readonly exportColumns = ['S.No.', 'Name', 'Email', 'Phone', 'Message', 'Requested At', 'Status'];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();
  readonly statusOptions: Exclude<CallbackStatusFilter, 'all'>[] = ['open', 'closed'];

  rows: CallbackRequestRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;
  selectedMessage = '';

  filters: CallbackRequestFilters = {
    search: '',
    requestFrom: '',
    requestTo: '',
    priority: 'all',
    status: 'all',
  };

  constructor(
    private readonly callbackRequestsService: CallbackRequestsService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadCallbackRequests(1);
    });

    this.loadCallbackRequests();
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
    this.loadCallbackRequests(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }

    this.loadCallbackRequests(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }

    this.loadCallbackRequests(this.currentPage + 1);
  }

  onRowStatusChange(row: CallbackRequestRow, value: string): void {
    const formattedStatus = this.formatStatus(value);
    row['Status'] = formattedStatus;

    const raw = row['__raw'] as CallbackRequestRecord | undefined;
    if (raw) {
      raw.status = formattedStatus;
    }
  }

  openMessageModal(row: CallbackRequestRow): void {
    this.selectedMessage = this.getRowMessage(row);
  }

  closeMessageModal(): void {
    this.selectedMessage = '';
  }

  getRowStatusValue(row: CallbackRequestRow): string {
    return String(row['Status'] ?? '').toLowerCase();
  }

  getRowMessage(row: CallbackRequestRow): string {
    return String(row['Message'] ?? '');
  }

  exportCsv(): void {
    if (!this.rows.length) {
      this.notificationService.warning('No callback requests available to export.');
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
    link.download = `callback-requests-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadCallbackRequests(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (this.filters.requestFrom && this.filters.requestTo && this.filters.requestFrom > this.filters.requestTo) {
      this.notificationService.warning('Request From date cannot be later than Request To date.');
      return;
    }

    this.loading = true;

    this.callbackRequestsService
      .fetchCallbackRequestsByAdmin({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        request_from: this.filters.requestFrom,
        request_to: this.filters.requestTo,
        priority: this.filters.priority,
        status: this.filters.status,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load callback requests.');
            this.stopLoading();
            return;
          }

          const callbackRequests = this.extractCallbackRequests(response);
          const pagination = this.extractPagination(response, callbackRequests.length, page);

          this.rows = callbackRequests.map((request, index) => this.mapCallbackRequestRow(request, index, pagination.page));
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

  private extractCallbackRequests(response: CallbackRequestsApiResponse): CallbackRequestRecord[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload as CallbackRequestRecord[];
    }

    if (payload && typeof payload === 'object') {
      const candidates = [
        (payload as { callbackRequests?: unknown }).callbackRequests,
        (payload as { requests?: unknown }).requests,
        (payload as { items?: unknown }).items,
        (payload as { rows?: unknown }).rows,
        (payload as { records?: unknown }).records,
      ];

      const matchingArray = candidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray as CallbackRequestRecord[];
      }
    }

    return [];
  }

  private extractPagination(
    response: CallbackRequestsApiResponse,
    itemCount: number,
    requestedPage: number,
  ): Required<CallbackRequestsPaginationMeta> {
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

  private pickPaginationObject(value: unknown): CallbackRequestsPaginationMeta | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate as CallbackRequestsPaginationMeta;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value as CallbackRequestsPaginationMeta;
    }

    return null;
  }

  private mapCallbackRequestRow(
    request: CallbackRequestRecord,
    index: number,
    page: number,
  ): CallbackRequestRow {
    return {
      'S.No.': (page - 1) * this.pageSize + index + 1,
      Name: request.name || 'N/A',
      Email: request.email || 'N/A',
      Phone: request.phone || 'N/A',
      Message: request.message || 'N/A',
      'Requested At': this.formatDateTime(request.requested_at),
      Priority: this.formatPriority(request.priority),
      Status: this.formatStatus(request.status),
      Action: 'View',
      __raw: request,
    };
  }

  private formatPriority(priority: string | null | undefined): string {
    if (!priority) {
      return 'N/A';
    }

    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
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
