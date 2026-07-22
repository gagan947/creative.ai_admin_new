import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UiButtonComponent } from '../../../shared/components';
import { UsersService, UserRow } from '../services/users.service';

interface UsersFilters {
  search: string;
  signupFrom: string;
  signupTo: string;
  plan: string;
  status: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiButtonComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  users: UserRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;

  filters: UsersFilters = {
    search: '',
    signupFrom: '',
    signupTo: '',
    plan: 'all',
    status: 'all',
  };

  constructor(
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadUsers(1);
    });

    this.loadUsers();
  }

  get hasRows(): boolean {
    return this.users.length > 0;
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
    this.loadUsers(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }
    this.loadUsers(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }
    this.loadUsers(this.currentPage + 1);
  }

  exportCsv(): void {
    if (!this.users.length) {
      this.notificationService.warning('No users data available to export.');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Signup Date', 'Plan', 'Credits Used', 'Remaining', 'Status'];
    const dataRows = this.users.map((user) => [
      `"${String(user.name).replace(/"/g, '""')}"`,
      `"${String(user.full_phone).replace(/"/g, '""')}"`,
      `"${String(user.email).replace(/"/g, '""')}"`,
      `"${String(user.signupDate).replace(/"/g, '""')}"`,
      `"${String(user.plan).replace(/"/g, '""')}"`,
      `"${String(user.creditsUsed)}"`,
      `"${String(user.creditsRemaining)}"`,
      `"${String(user.status).replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-page-${this.currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadUsers(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    if (this.filters.signupFrom && this.filters.signupTo && this.filters.signupFrom > this.filters.signupTo) {
      this.notificationService.warning('Signup From date cannot be later than Signup To date.');
      return;
    }

    this.loading = true;

    this.usersService
      .fetchAllUsersByAdmin({
        page,
        limit: this.pageSize,
        search: this.filters.search,
        plan: this.filters.plan,
        status: this.filters.status,
        signup_from: this.filters.signupFrom,
        signup_to: this.filters.signupTo,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.users = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load users.');
            this.stopLoading();
            return;
          }

          const rawUsers = this.extractUsers(response);
          const pagination = this.extractPagination(response, rawUsers.length, page);

          this.users = rawUsers.map((user) => this.mapUser(user));
          this.currentPage = pagination.page;
          this.totalItems = pagination.total;
          this.totalPages = pagination.totalPages;
          this.stopLoading();
        },
        error: () => {
          this.users = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.stopLoading();
        },
      });
  }

  private extractUsers(response: any): any[] {
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const candidates = [
        (payload as any).users,
        (payload as any).items,
        (payload as any).rows,
        (payload as any).records,
        (payload as any).data,
      ];

      const matchingArray = candidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(matchingArray)) {
        return matchingArray;
      }
    }

    return [];
  }

  private extractPagination(
    response: any,
    itemCount: number,
    requestedPage: number,
  ): any {
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

  private pickPaginationObject(value: unknown): any | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const paginationCandidate = (value as { pagination?: unknown }).pagination;
    if (paginationCandidate && typeof paginationCandidate === 'object') {
      return paginationCandidate;
    }

    if ('page' in (value as object) || 'total' in (value as object) || 'totalPages' in (value as object)) {
      return value;
    }

    return null;
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

  private mapUser(user: any): UserRow {
    const id = user.id || user._id || user.userId || user.user_id || '';
    const name = user.name || user.displayName || user.username || user.user || 'N/A';
    const full_phone = user.full_phone || user.phoneNumber || user.mobile || 'N/A';
    const email = user.email || 'N/A';

    let signupDate = 'N/A';
    const rawDate = user.signupDate || user.createdAt || user.created_at || user.signup_date;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          signupDate = d.toISOString().split('T')[0];
        } else {
          signupDate = rawDate;
        }
      } catch {
        signupDate = rawDate;
      }
    }

    const plan = user.plan || user.plan_name || user.planName || user.currentPlan || 'N/A';
    const creditsUsed = typeof user.creditsUsed !== 'undefined' ? user.creditsUsed :
      typeof user.credits_used !== 'undefined' ? user.credits_used :
        typeof user.usedCredits !== 'undefined' ? user.usedCredits :
          typeof user.used_credits !== 'undefined' ? user.used_credits : 0;

    const creditsRemaining = typeof user.creditsRemaining !== 'undefined' ? user.creditsRemaining :
      typeof user.credits_remaining !== 'undefined' ? user.credits_remaining :
        typeof user.remaining !== 'undefined' ? user.remaining :
          typeof user.remainingCredits !== 'undefined' ? user.remainingCredits :
            typeof user.remaining_credits !== 'undefined' ? user.remaining_credits : 0;

    let status = 'Active';
    const rawStatus = typeof user.user_status !== 'undefined' && user.user_status !== null ? user.user_status : user.status;
    if (rawStatus === 0 || rawStatus === '0' || String(rawStatus).toLowerCase() === 'inactive') {
      status = 'Inactive';
    } else if (rawStatus === 1 || rawStatus === '1' || String(rawStatus).toLowerCase() === 'active') {
      status = 'Active';
    } else if (rawStatus) {
      const statusStr = String(rawStatus).trim();
      status = statusStr ? statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase() : 'Active';
    }

    return {
      id,
      name,
      full_phone,
      email,
      signupDate,
      plan,
      creditsUsed: Number(creditsUsed),
      creditsRemaining: Number(creditsRemaining),
      status
    };
  }
}

