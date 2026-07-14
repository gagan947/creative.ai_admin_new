import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';
import { NotificationService } from '../../../core/services/notification.service';
import { SubscriptionsBillingService, SubscriptionRecord } from '../services/subscriptions-billing.service';

type SubscriptionRow = Record<string, any>;

@Component({
  selector: 'app-subscriptions-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiTableComponent],
  providers: [DatePipe],
  templateUrl: './subscriptions-billing.component.html',
  styleUrls: ['./subscriptions-billing.component.scss'],
})
export class SubscriptionsBillingComponent implements OnInit {
  columns = ['S.No.', 'User', 'Plan', 'Amount', 'Billing Cycle', 'Last Payment', 'Next Payment'];
  rows: SubscriptionRow[] = [];

  loading = false;
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;

  // Filters
  searchQuery = '';
  billingFrom = '';
  billingTo = '';
  selectedPlan = 'All';
  selectedCycle = 'All';

  readonly filterChanges$ = new Subject<void>();

  constructor(
    private readonly subscriptionsBillingService: SubscriptionsBillingService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadSubscriptions(1);
    });

    this.loadSubscriptions();
  }

  onFilterChange(): void {
    this.filterChanges$.next();
  }

  loadSubscriptions(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.subscriptionsBillingService
      .getAllSubscriptions({
        page,
        limit: this.pageSize,
        search: this.searchQuery,
        billing_from: this.billingFrom,
        billing_to: this.billingTo,
        plan: this.selectedPlan,
        cycle: this.selectedCycle,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load subscriptions.');
            this.stopLoading();
            return;
          }

          const records = response.data || [];
          this.totalItems = response.totalRecords || records.length;
          this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
          this.currentPage = page;

          this.rows = records.map((record, index) => this.mapRow(record, index));
          this.stopLoading();
        },
        error: (err) => {
          this.rows = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.notificationService.error(err.message || 'An error occurred while fetching subscriptions.');
          this.stopLoading();
        },
      });
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

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }
    this.loadSubscriptions(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }
    this.loadSubscriptions(this.currentPage + 1);
  }

  private mapRow(record: SubscriptionRecord, index: number): SubscriptionRow {
    return {
      'S.No.': (this.currentPage - 1) * this.pageSize + index + 1,
      User: record['user'] || 'N/A',
      Plan: record['plan'] || 'N/A',
      Amount: record['amount'] || '₹0',
      'Billing Cycle': record['billing_cycle'] || 'N/A',
      'Last Payment': record['last_payment'] ? this.formatDate(record['last_payment']) : 'N/A',
      'Next Payment': record['next_payment'] ? this.formatDate(record['next_payment']) : 'N/A',
      raw: record,
    };
  }

  private formatDate(value: string): string {
    return this.datePipe.transform(value, 'dd MMM yyyy') || value;
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}
