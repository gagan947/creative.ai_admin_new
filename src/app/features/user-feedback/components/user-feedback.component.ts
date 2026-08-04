import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent, UiModalComponent, UiTableComponent } from '../../../shared/components';
import {
  UserFeedbackTypeFilter,
  UserFeedbackRecord,
  UserFeedbackApiResponse,
  UserFeedbackPaginationMeta,
  UserFeedbackService,
} from '../services/user-feedback.service';

type UserFeedbackRow = Record<string, unknown>;

interface UserFeedbackFilters {
  search: string;
  requestFrom: string;
  requestTo: string;
  feedbackType: UserFeedbackTypeFilter;
}

@Component({
  selector: 'app-user-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiModalComponent, UiTableComponent],
  providers: [DatePipe],
  templateUrl: './user-feedback.component.html',
  styleUrls: ['./user-feedback.component.scss'],
})
export class UserFeedbackComponent implements OnInit {
  readonly columns = ['S.No.', 'Name', 'Email', 'Project Name', 'Rating', 'Feedback', 'Submitted At', 'Action'];
  readonly exportColumns = ['S.No.', 'Name', 'Email', 'Project Name', 'Rating', 'Feedback', 'Submitted At'];
  pageSize = 10;
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly textFilterChanges$ = new Subject<void>();

  rows: UserFeedbackRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;
  selectedMessage = '';

  filters: UserFeedbackFilters = {
    search: '',
    requestFrom: '',
    requestTo: '',
    feedbackType: 'all',
  };

  constructor(
    private readonly userFeedbackService: UserFeedbackService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadUserFeedbacks(1);
    });

    this.loadUserFeedbacks();
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
    this.loadUserFeedbacks(1);
  }

  onPageSizeChange(newSize: number | string): void {
    const size = Number(newSize);
    if (size && this.pageSize !== size) {
      this.pageSize = size;
      this.loadUserFeedbacks(1);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }

    this.loadUserFeedbacks(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }

    this.loadUserFeedbacks(this.currentPage + 1);
  }

  openMessageModal(row: UserFeedbackRow): void {
    this.selectedMessage = this.getRowMessage(row);
  }

  closeMessageModal(): void {
    this.selectedMessage = '';
  }

  getRowMessage(row: UserFeedbackRow): string {
    return String(row['Feedback'] ?? '');
  }

  exportCsv(): void {
    if (!this.rows.length) {
      this.notificationService.warning('No user feedbacks available to export.');
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
    link.download = `user-feedbacks-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadUserFeedbacks(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (this.filters.requestFrom && this.filters.requestTo && this.filters.requestFrom > this.filters.requestTo) {
      this.notificationService.warning('Request From date cannot be later than Request To date.');
      return;
    }

    this.loading = true;

    this.userFeedbackService
      .fetchUserFeedbacks({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        request_from: this.filters.requestFrom,
        request_to: this.filters.requestTo,
        feedback_type: this.filters.feedbackType,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load user feedbacks.');
            this.stopLoading();
            return;
          }

          const userFeedbacks = this.extractUserFeedbacks(response);
          const pagination = this.extractPagination(response, userFeedbacks.length, page);

          this.rows = userFeedbacks.map((feedback, index) => this.mapUserFeedbackRow(feedback, index, pagination.page));
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

  private extractUserFeedbacks(response: UserFeedbackApiResponse): UserFeedbackRecord[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload as UserFeedbackRecord[];
    }

    if (payload && typeof payload === 'object') {
      const candidates = [
        (payload as { userFeedbacks?: unknown }).userFeedbacks,
        (payload as { feedbacks?: unknown }).feedbacks,
        (payload as { requests?: unknown }).requests,
        (payload as { items?: unknown }).items,
        (payload as { rows?: unknown }).rows,
        (payload as { records?: unknown }).records,
      ];

      const matchingArray = candidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray as UserFeedbackRecord[];
      }
    }

    return [];
  }

  private extractPagination(
    response: UserFeedbackApiResponse,
    itemCount: number,
    requestedPage: number,
  ): Required<UserFeedbackPaginationMeta> {
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

  private pickPaginationObject(value: unknown): UserFeedbackPaginationMeta | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate as UserFeedbackPaginationMeta;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value as UserFeedbackPaginationMeta;
    }

    return null;
  }

  private mapUserFeedbackRow(
    request: UserFeedbackRecord,
    index: number,
    page: number,
  ): UserFeedbackRow {
    return {
      'S.No.': (page - 1) * this.pageSize + index + 1,
      Name: request.user_name || 'N/A',
      Email: request.user_email || 'N/A',
      'Project Name': request.project_name || 'N/A',
      Rating: request.rating ? `${request.rating}/5` : 'N/A',
      Feedback: request.feedback_text || request.reason || 'N/A',
      'Submitted At': this.formatDateTime(request.created_at),
      Action: 'View',
      __raw: request,
    };
  }

  private formatType(type: string | null | undefined): string {
    if (!type) {
      return 'N/A';
    }

    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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
