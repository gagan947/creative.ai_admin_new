import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
export type BuildStatusFilter = 'all' | 'success' | 'failed';

export interface BuildRecord {
  build_id: string;
  user: string;
  project: string;
  status: string;
  time_taken: string | null;
  credits_used: number | string | null;
  timestamp: string;
}

export interface BuildsQuery {
  page: number;
  limit: number;
  search?: string;
  from?: string;
  to?: string;
  status?: BuildStatusFilter;
  project?: string;
}

export interface BuildsPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface BuildsApiResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  pagination?: BuildsPaginationMeta;
  meta?: BuildsPaginationMeta;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class BuildsService {
  constructor(private readonly apiService: ApiService) { }

  fetchBuildsByAdmin(query: BuildsQuery): Observable<BuildsApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.from) {
      params.set('from', query.from);
    }

    if (query.to) {
      params.set('to', query.to);
    }

    if (query.status && query.status !== 'all') {
      params.set('status', query.status);
    }

    if (query.project?.trim()) {
      params.set('project', query.project.trim());
    }

    return this.apiService.get<BuildsApiResponse>(`fetchBuildsByAdmin?${params.toString()}`);
  }
}
