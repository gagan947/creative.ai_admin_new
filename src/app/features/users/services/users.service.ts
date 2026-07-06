import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { ApiService } from '../../../core/services/api.service';

export interface UserRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  signupDate: string;
  plan: string;
  creditsUsed: number;
  creditsRemaining: number;
  status: string;
}

export interface UsersQuery {
  page: number;
  limit: number;
  search?: string;
  plan?: string;
  status?: string;
  signup_from?: string;
  signup_to?: string;
}

export interface UsersPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface UsersApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: unknown;
  pagination?: UsersPaginationMeta;
  meta?: UsersPaginationMeta;
  total?: number;
  totalRecords?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly apiService: ApiService) {}

  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('users');
  }

  fetchAllUsersByAdmin(query: UsersQuery): Observable<UsersApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    if (query.plan && query.plan.toLowerCase() !== 'all') {
      params.set('plan', query.plan);
    }

    if (query.status && query.status.toLowerCase() !== 'all') {
      params.set('status', query.status);
    }

    if (query.signup_from) {
      params.set('signup_from', query.signup_from);
    }

    if (query.signup_to) {
      params.set('signup_to', query.signup_to);
    }

    return this.apiService.get<UsersApiResponse>(`fetchAllUsersByAdmin?${params.toString()}`);
  }
}

