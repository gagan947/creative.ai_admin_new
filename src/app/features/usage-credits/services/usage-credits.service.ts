import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export type UsageCreditsPlanFilter = 'all' | string;
export type UsageCreditsRangeFilter = 'all' | '0-1000' | '1000-5000' | '5000+' | 'low' | 'medium' | 'high';

export interface UsageCreditsRecord {
  user: string;
  plan_name: string;
  credits_given: number | string | null;
  credits_used: number | string | null;
  remaining: number | string | null;
}

export interface UsageCreditsQuery {
  page: number;
  limit: number;
  search?: string;
  usage_from?: string;
  usage_to?: string;
  plan?: UsageCreditsPlanFilter;
  credit_range?: UsageCreditsRangeFilter;
}

export interface UsageCreditsPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface UsageCreditsApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: unknown;
  pagination?: UsageCreditsPaginationMeta;
  meta?: UsageCreditsPaginationMeta;
  total?: number;
  totalRecords?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class UsageCreditsService {
  constructor(private readonly apiService: ApiService) {}

  fetchUsageCreditsByAdmin(query: UsageCreditsQuery): Observable<UsageCreditsApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.usage_from) {
      params.set('usage_from', query.usage_from);
    }

    if (query.usage_to) {
      params.set('usage_to', query.usage_to);
    }

    if (query.plan && query.plan !== 'all') {
      params.set('plan', query.plan);
    }

    if (query.credit_range && query.credit_range !== 'all') {
      params.set('credit_range', query.credit_range);
    }

    return this.apiService.get<UsageCreditsApiResponse>(`fetchUsageCreditsByAdmin?${params.toString()}`);
  }
}
