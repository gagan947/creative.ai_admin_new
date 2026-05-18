import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export type CallbackPriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type CallbackStatusFilter = 'all' | 'open' | 'closed';

export interface CallbackRequestRecord {
  name: string;
  email: string;
  phone: string;
  message: string;
  requested_at: string;
  priority: string;
  status: string;
}

export interface CallbackRequestsQuery {
  page: number;
  limit: number;
  search?: string;
  request_from?: string;
  request_to?: string;
  priority?: CallbackPriorityFilter;
  status?: CallbackStatusFilter;
}

export interface CallbackRequestsPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface CallbackRequestsApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: unknown;
  pagination?: CallbackRequestsPaginationMeta;
  meta?: CallbackRequestsPaginationMeta;
  total?: number;
  totalRecords?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class CallbackRequestsService {
  constructor(private readonly apiService: ApiService) {}

  fetchCallbackRequestsByAdmin(query: CallbackRequestsQuery): Observable<CallbackRequestsApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.request_from) {
      params.set('request_from', query.request_from);
    }

    if (query.request_to) {
      params.set('request_to', query.request_to);
    }

    if (query.priority && query.priority !== 'all') {
      params.set('priority', query.priority);
    }

    if (query.status && query.status !== 'all') {
      params.set('status', query.status);
    }

    return this.apiService.get<CallbackRequestsApiResponse>(`fetchCallbackRequestsByAdmin?${params.toString()}`);
  }
}
