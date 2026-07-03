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

export interface ProjectTemplateErrorReport {
  id?: number;
  attempt?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  error_messages?: string | null;
}

export interface ProjectTemplateCustomizationReport {
  id?: number;
  prompt?: string | null;
  user_id?: number | null;
  created_at?: string | null;
  inquiry_id?: number | null;
  updated_at?: string | null;
  credits_deducted?: number | null;
  public_template_id?: string | null;
}

export interface ProjectTemplateRecord {
  build_by?: string | null;
  created_at?: string | null;
  build_status?: number | string | null;
  variation_no?: number | null;
  error_reports?: ProjectTemplateErrorReport[] | null;
  customization_reports?: ProjectTemplateCustomizationReport[] | null;
  customization_credits_total?: number | null;
  react_build_url?: string | null;
  public_template_id?: string | null;
  selected_deployment?: number | boolean | null;
}

export interface ProjectDetailRecord extends ProjectRecord {
  userId?: number | null;
  projectId?: number | null;
  project_type?: string | null;
  ai_model?: string | null;
  model_version?: string | null;
  clientProjectLogo?: string | null;
  projectFeatures?: string | null;
  user_prompt?: string | null;
  build_status?: number | string | null;
  deployed_url?: string | null;
  deployed_template_id?: number | null;
  currentRoutes?: string | null;
  payment_status?: number | boolean | null;
  is_header_available?: number | boolean | null;
  reminder_count?: number | null;
  last_reminder_sent?: string | null;
  templates?: ProjectTemplateRecord[] | null;
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

export interface ProjectDetailApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: ProjectDetailRecord | null;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private readonly apiService: ApiService) { }

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

  fetchTemplateByInquieryId(inquieryId: string | number): Observable<ProjectDetailApiResponse> {
    const params = new URLSearchParams();
    params.set('inquieryId', String(inquieryId));

    return this.apiService.get<ProjectDetailApiResponse>(`fetchTemplateByInquieryId?${params.toString()}`);
  }

  private mapStatusFilter(status: Exclude<ProjectStatusFilter, 'all'>): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
