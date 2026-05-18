import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export type DeployStatusFilter = 'all' | 'success' | 'failed' | 'pending';

export interface DeployRecord {
  user: string;
  project_id: string;
  project_name: string;
  domain: string;
  environment: string;
  requested_at: string;
  status: string;
}

export interface DeployQuery {
  page: number;
  limit: number;
  search?: string;
  requested_from?: string;
  requested_to?: string;
  status?: DeployStatusFilter;
  user?: string;
}

export interface DeployPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface DeployApiResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  pagination?: DeployPaginationMeta;
  meta?: DeployPaginationMeta;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class DeployService {
  constructor(private readonly apiService: ApiService) {}

  fetchDeployRequestsByAdmin(query: DeployQuery): Observable<DeployApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.requested_from) {
      params.set('requested_from', query.requested_from);
    }

    if (query.requested_to) {
      params.set('requested_to', query.requested_to);
    }

    if (query.status && query.status !== 'all') {
      params.set('status', query.status);
    }

    if (query.user?.trim()) {
      params.set('user', query.user.trim());
    }

    return this.apiService.get<DeployApiResponse>(`fetchDeployRequestsByAdmin?${params.toString()}`);
  }
}
