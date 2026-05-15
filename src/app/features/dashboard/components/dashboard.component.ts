import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

type FilterMode = 'range' | 'custom';

interface DashboardFiltersApplied {
  range: string;
  from: string;
  to: string;
  userId: string | null;
  planKey: string | null;
  buildStatus: string | null;
}

interface DashboardCards {
  totalUsers: number;
  activeUsersInRange: number;
  totalRegisteredUsers: number;
  totalProjects: number;
  totalBuilds: number;
  failedBuilds: number;
  failureRate: number;
  creditsUsed: number;
  filteredCreditsUsed: number;
  avgCreditsPerUser: number;
  revenue: number;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface BuildSuccessFailedPoint {
  label: string;
  success: number;
  failed: number;
}

interface SuccessRateChart {
  successRate: number;
  failureRate: number;
}

interface DashboardCharts {
  userGrowth: ChartPoint[];
  revenueTrend: ChartPoint[];
  planMix: ChartPoint[];
  buildSuccessVsFailed: BuildSuccessFailedPoint[];
  successRate: SuccessRateChart;
}

interface DashboardOverviewData {
  filtersApplied: DashboardFiltersApplied;
  cards: DashboardCards;
  charts: DashboardCharts;
}

interface DashboardOverviewResponse {
  success: boolean;
  data: DashboardOverviewData;
  message?: string;
}

interface DashboardDeepDiveResponse {
  success?: boolean;
  data?: DashboardDeepDiveData;
  message?: string;
  [key: string]: unknown;
}

interface DashboardDeepDiveMetric {
  planKey?: string;
  label: string;
  value: number;
}

interface TopCreditConsumer {
  userId: number;
  userName: string;
  planName: string;
  creditsUsed: number;
}

interface UserDetailedBreakdown {
  userId: number;
  userName: string;
  planName: string;
  projects: number;
  builds: number;
  failures: number;
  creditsUsed: number;
  revenue: number;
}

interface LiveActivityItem {
  type: string;
  userName: string;
  detail: string;
  occurredAt: string;
}

interface DashboardDeepDiveData {
  planDistribution: DashboardDeepDiveMetric[];
  topCreditConsumers: TopCreditConsumer[];
  paymentModeBreakdown: DashboardDeepDiveMetric[];
  userWiseDetailedBreakdown: UserDetailedBreakdown[];
  liveActivityFeed: LiveActivityItem[];
}

interface MetricCard {
  label: string;
  value: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  loading = false;
  filterMode: FilterMode = 'range';
  filters = {
    range: '7d',
    from: '',
    to: '',
    userId: '',
    planKey: '',
    buildStatus: '',
  };

  cards: MetricCard[] = [];
  appliedFilters: DashboardFiltersApplied | null = null;
  cardsData: DashboardCards | null = null;
  chartsData: DashboardCharts | null = null;
  deepDiveData: DashboardDeepDiveData | null = null;

  readonly lineChartType: ChartConfiguration<'line'>['type'] = 'line';
  readonly barChartType: ChartConfiguration<'bar'>['type'] = 'bar';
  readonly doughnutChartType: ChartConfiguration<'doughnut'>['type'] = 'doughnut';
  readonly pieChartType: ChartConfiguration<'pie'>['type'] = 'pie';

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148, 163, 184, 0.16)' },
      },
    },
  };

  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148, 163, 184, 0.16)' },
      },
    },
  };

  readonly stackedBarChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#334155' },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148, 163, 184, 0.16)' },
      },
    },
  };

  readonly doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#334155' },
      },
    },
  };

  readonly pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#334155' },
      },
    },
  };

  userGrowthChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  planMixChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  buildStatusChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  successRateChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  constructor(
    private readonly apiService: ApiService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
    const weekAgo = this.datePipe.transform(this.daysAgo(6), 'yyyy-MM-dd') || '';
    this.filters.from = weekAgo;
    this.filters.to = today;
    this.reloadDashboardData();
  }

  setPreset(range: string): void {
    this.filterMode = 'range';
    this.filters.range = range;
    this.reloadDashboardData();
  }

  applyCustomDate(): void {
    this.filterMode = 'custom';
    this.reloadDashboardData();
  }

  reloadDashboardData(): void {
    if (!this.canLoadDashboard()) {
      return;
    }

    this.loadDashboard();
    this.loadDashboard2();
  }

  loadDashboard(): void {
    // this.loading = true;
    this.apiService.get<DashboardOverviewResponse>(this.buildDashboardPath('dashboardOverview')).subscribe({
      next: (response) => {
        this.stopLoading();

        if (!response.success || !response.data) {
          this.clearDashboardData();
          this.notificationService.error(response.message || 'Unable to load dashboard overview.');
          return;
        }

        this.mapDashboardData(response.data);
      },
      error: () => {
        this.stopLoading();
        this.clearDashboardData();
      },
    });
  }

  loadDashboard2(): void {
    this.apiService
      .get<DashboardDeepDiveResponse>(this.buildDashboardPath('dashboardDeepDive', true))
      .subscribe({
        next: (response) => {
          this.stopLoading();
          console.log('dashboardDeepDive response:', response);

          if (!response.success || !response.data) {
            this.deepDiveData = null;
            return;
          }

          this.deepDiveData = response.data;
        },
        error: () => {
          this.stopLoading();
          this.deepDiveData = null;
        },
      });
  }

  get hasResults(): boolean {
    return !!this.cardsData && !!this.chartsData;
  }

  get hasDeepDiveResults(): boolean {
    return !!this.deepDiveData;
  }

  get totalUsers(): number {
    return this.cardsData?.totalUsers || 0;
  }

  get totalProjects(): number {
    return this.cardsData?.totalProjects || 0;
  }

  get totalBuilds(): number {
    return this.cardsData?.totalBuilds || 0;
  }

  get failedBuilds(): number {
    return this.cardsData?.failedBuilds || 0;
  }

  get successRate(): number {
    return this.roundMetric(this.chartsData?.successRate?.successRate || 0);
  }

  get failureRate(): number {
    return this.roundMetric(this.chartsData?.successRate?.failureRate || this.cardsData?.failureRate || 0);
  }

  private canLoadDashboard(): boolean {
    if (this.loading) {
      return false;
    }

    if (this.filterMode === 'custom' && (!this.filters.from || !this.filters.to)) {
      this.notificationService.warning('Please select both from and to dates.');
      return false;
    }

    return true;
  }

  private buildDashboardPath(path: string, includeLimit = false): string {
    const params = new URLSearchParams();

    if (this.filterMode === 'custom') {
      params.set('from', this.filters.from);
      params.set('to', this.filters.to);
    } else {
      params.set('range', this.filters.range);
    }

    params.set('userId', this.filters.userId);
    params.set('planKey', this.filters.planKey);
    params.set('buildStatus', this.filters.buildStatus);

    if (includeLimit) {
      params.set('limit', '10');
    }

    return `${path}?${params.toString()}`;
  }

  private mapDashboardData(data: DashboardOverviewData): void {
    this.appliedFilters = data.filtersApplied;
    this.cardsData = data.cards;
    this.chartsData = data.charts;

    this.filters.range = data.filtersApplied.range || this.filters.range;
    this.filters.from = this.normalizeDate(data.filtersApplied.from) || this.filters.from;
    this.filters.to = this.normalizeDate(data.filtersApplied.to) || this.filters.to;
    this.filters.userId = data.filtersApplied.userId || '';
    this.filters.planKey = this.normalizeOptionalFilter(data.filtersApplied.planKey);
    this.filters.buildStatus = this.normalizeOptionalFilter(data.filtersApplied.buildStatus);

    this.cards = [
      { label: 'Total Users', value: this.formatNumber(data.cards.totalUsers) },
      { label: 'Active Users In Range', value: this.formatNumber(data.cards.activeUsersInRange) },
      { label: 'Total Projects', value: this.formatNumber(data.cards.totalProjects) },
      { label: 'Total Builds', value: this.formatNumber(data.cards.totalBuilds) },
      { label: 'Failed Builds', value: this.formatNumber(data.cards.failedBuilds) },
      { label: 'Failure Rate', value: `${this.formatNumber(data.cards.failureRate)}%` },
      { label: 'Credits Used', value: this.formatNumber(data.cards.creditsUsed) },
      { label: 'Filtered Credits Used', value: this.formatNumber(data.cards.filteredCreditsUsed) },
      { label: 'Avg Credits Per User', value: this.formatNumber(data.cards.avgCreditsPerUser) },
      { label: 'Revenue', value: `Rs ${this.formatNumber(data.cards.revenue)}` },
    ];

    this.userGrowthChartData = {
      labels: data.charts.userGrowth.map((item) => this.formatShortDate(item.label)),
      datasets: [
        {
          data: data.charts.userGrowth.map((item) => item.value),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.18)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
        },
      ],
    };

    this.revenueChartData = {
      labels: data.charts.revenueTrend.map((item) => this.formatShortDate(item.label)),
      datasets: [
        {
          data: data.charts.revenueTrend.map((item) => item.value),
          backgroundColor: '#6366f1',
          borderRadius: 8,
          maxBarThickness: 34,
        },
      ],
    };

    this.planMixChartData = {
      labels: data.charts.planMix.map((item) => item.label),
      datasets: [
        {
          data: data.charts.planMix.map((item) => item.value),
          backgroundColor: ['#60a5fa', '#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6'],
          borderWidth: 0,
        },
      ],
    };

    this.buildStatusChartData = {
      labels: data.charts.buildSuccessVsFailed.map((item) => this.formatShortDate(item.label)),
      datasets: [
        {
          label: 'Success',
          data: data.charts.buildSuccessVsFailed.map((item) => item.success),
          backgroundColor: '#22d3ee',
          borderRadius: 8,
          maxBarThickness: 28,
        },
        {
          label: 'Failed',
          data: data.charts.buildSuccessVsFailed.map((item) => item.failed),
          backgroundColor: '#ef4444',
          borderRadius: 8,
          maxBarThickness: 28,
        },
      ],
    };

    this.successRateChartData = {
      labels: ['Success', 'Failure'],
      datasets: [
        {
          data: [this.successRate, this.failureRate],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
        },
      ],
    };
  }

  private clearDashboardData(): void {
    this.cards = [];
    this.appliedFilters = null;
    this.cardsData = null;
    this.chartsData = null;
    this.userGrowthChartData = { labels: [], datasets: [] };
    this.revenueChartData = { labels: [], datasets: [] };
    this.planMixChartData = { labels: [], datasets: [] };
    this.buildStatusChartData = { labels: [], datasets: [] };
    this.successRateChartData = { labels: [], datasets: [] };
  }

  private normalizeDate(value: string | null): string {
    if (!value) {
      return '';
    }

    return this.datePipe.transform(value, 'yyyy-MM-dd') || '';
  }

  private normalizeOptionalFilter(value: string | null): string {
    if (!value || value === 'all') {
      return '';
    }

    return value;
  }

  private formatShortDate(value: string): string {
    return this.datePipe.transform(value, 'dd MMM') || value;
  }

  formatDateTime(value: string): string {
    return this.datePipe.transform(value, 'dd MMM yyyy, hh:mm a') || value;
  }

  formatActivityTitle(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  }

  private roundMetric(value: number): number {
    return Number(value.toFixed(2));
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}
