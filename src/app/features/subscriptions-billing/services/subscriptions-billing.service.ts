import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface SubscriptionQuery {
  page: number;
  limit: number;
  search?: string;
  billing_from?: string;
  billing_to?: string;
  plan?: string;
  cycle?: string;
}

export interface SubscriptionRecord {
  id?: string;
  user_name?: string;
  plan_name?: string;
  amount?: string;
  cycle?: string;
  last_payment?: string;
  next_payment?: string;
  [key: string]: any;
}

export interface SubscriptionApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: SubscriptionRecord[];
  totalRecords?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsBillingService {
  constructor(private readonly apiService: ApiService) { }

  getAllSubscriptions(query: SubscriptionQuery): Observable<SubscriptionApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page || 1));
    params.set('limit', String(query.limit || 20));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }
    if (query.billing_from) {
      params.set('billing_from', query.billing_from);
    }
    if (query.billing_to) {
      params.set('billing_to', query.billing_to);
    }
    if (query.plan && query.plan.toLowerCase() !== 'all') {
      params.set('plan', query.plan);
    }
    if (query.cycle && query.cycle.toLowerCase() !== 'all') {
      params.set('cycle', query.cycle);
    }

    // Defaulting endpoint to 'subscriptions' - adjust if different
    return this.apiService.get<SubscriptionApiResponse>(`fetchSubscriptionsBillingByAdmin?${params.toString()}`);
  }

  getAllPlans(): Observable<any> {
    return this.apiService.get<any>('getAllPlans');
  }
}
