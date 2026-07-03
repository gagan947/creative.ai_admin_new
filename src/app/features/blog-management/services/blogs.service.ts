import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface BlogRecord {
  id?: number | string;
  title: string;
  slug: string;
  post_date: string;
  description: string;
  text_editor: string;
  banner_image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogsQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface BlogsApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: BlogRecord[];
  totalRecords?: number;
}

@Injectable({ providedIn: 'root' })
export class BlogsService {
  constructor(private readonly apiService: ApiService) {}

  getAllBlogs(query: BlogsQuery): Observable<BlogsApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }

    return this.apiService.get<BlogsApiResponse>(`getAllBlogs?${params.toString()}`);
  }

  getBlogById(id: string | number): Observable<{ success?: boolean; message?: string; data: BlogRecord[] }> {
    return this.apiService.get<{ success?: boolean; message?: string; data: BlogRecord[] }>(`getBlogById?id=${id}`);
  }

  deleteBlog(id: string | number): Observable<{ success?: boolean; message?: string }> {
    return this.apiService.delete<{ success?: boolean; message?: string }>(`deleteBlog?id=${id}`);
  }

  addBlog(formData: FormData): Observable<{ success?: boolean; message?: string }> {
    return this.apiService.post<{ success?: boolean; message?: string }>('addBlogsCMS', formData);
  }

  updateBlog(formData: FormData): Observable<{ success?: boolean; message?: string }> {
    return this.apiService.post<{ success?: boolean; message?: string }>('updateBlogsCMS', formData);
  }
}
