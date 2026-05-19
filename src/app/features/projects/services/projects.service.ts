import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export type ProjectStatusFilter = 'all' | 'active' | 'draft' | 'archived';

export interface ProjectRecord {
  id?: number;
  public_id?: string | null;
  clientProjectName?: string | null;
  projectStatus?: number | string | null;
  project_deployed?: number | boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  name?: string | null;
}

export interface ProjectsQuery {
  page: number;
  limit: number;
  search?: string;
  user?: string;
  status?: ProjectStatusFilter;
  createdFrom?: string;
  createdTo?: string;
}

export interface ProjectsPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ProjectsApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: unknown;
  pagination?: ProjectsPaginationMeta;
  meta?: ProjectsPaginationMeta;
  total?: number;
  totalRecords?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private readonly apiService: ApiService) {}

  fetchProjectsByUser(query: ProjectsQuery): Observable<ProjectsApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.user?.trim()) {
      params.set('user', query.user.trim());
    }

    if (query.status && query.status !== 'all') {
      params.set('status', this.mapStatusFilter(query.status));
    }

    if (query.createdFrom) {
      params.set('createdFrom', query.createdFrom);
    }

    if (query.createdTo) {
      params.set('createdTo', query.createdTo);
    }

    return this.apiService.get<ProjectsApiResponse>(`fetchProjectsByUser?${params.toString()}`);
  }

  private mapStatusFilter(status: Exclude<ProjectStatusFilter, 'all'>): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
