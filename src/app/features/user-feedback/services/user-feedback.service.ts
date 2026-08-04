import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export type UserFeedbackTypeFilter = 'all' | 'churn_survey' | 'general_feedback' | 'satisfaction_survey';

export interface UserFeedbackRecord {
  id?: number;
  user_id?: number;
  user_name: string;
  user_email: string;
  project_name?: string;
  project_template_id?: string;
  feedback_type: string;
  rating: number;
  reason?: string | null;
  feedback_text: string;
  created_at: string;
}

export interface UserFeedbackQuery {
  page: number;
  limit: number;
  search?: string;
  feedback_type?: UserFeedbackTypeFilter;
  request_from?: string;
  request_to?: string;
}

export interface UserFeedbackPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface UserFeedbackApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: unknown;
  pagination?: UserFeedbackPaginationMeta;
  meta?: UserFeedbackPaginationMeta;
  total?: number;
  totalRecords?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class UserFeedbackService {
  constructor(private readonly apiService: ApiService) { }

  fetchUserFeedbacks(query: UserFeedbackQuery): Observable<UserFeedbackApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.feedback_type && query.feedback_type !== 'all') {
      params.set('feedback_type', query.feedback_type);
    }

    if (query.request_from) {
      params.set('request_from', query.request_from);
    }

    if (query.request_to) {
      params.set('request_to', query.request_to);
    }

    // According to curl, the path is api/admin/fetchUserFeedbacks, but ApiService baseUrl is already up to /api
    // Wait, let's check ApiService usage. In callback-requests it calls `fetchCallbackRequestsByAdmin`.
    // The environment baseUrl is likely `https://api.creativethoughts.ai/api/admin`.
    return this.apiService.get<UserFeedbackApiResponse>(`fetchUserFeedbacks?${params.toString()}`);
  }
}
