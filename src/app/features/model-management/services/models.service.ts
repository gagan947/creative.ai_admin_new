import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface ModelRecord {
  id?: number | string;
  model_id: string;
  name: string;
  description: string;
  icon: string;
  tag: string;
  internal: string;
  is_default: number; // 1 or 0
  status: number; // 1 or 0
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelsQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface ModelsApiResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: ModelRecord[];
  totalRecords?: number;
}

@Injectable({ providedIn: 'root' })
export class ModelsService {
  constructor(private readonly apiService: ApiService) { }

  getAllModels(query: ModelsQuery): Observable<ModelsApiResponse> {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));
    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }
    return this.apiService.get<ModelsApiResponse>(`fetchAIModels?${params.toString()}`);
  }

  addModel(payload: Omit<ModelRecord, 'id'>): Observable<{ success?: boolean; message?: string; data?: ModelRecord }> {
    return this.apiService.post<{ success?: boolean; message?: string; data?: ModelRecord }>('addAIModel', payload);
  }

  updateModel(payload: ModelRecord): Observable<{ success?: boolean; message?: string; data?: ModelRecord }> {
    return this.apiService.put<{ success?: boolean; message?: string; data?: ModelRecord }>('updateAIModel', payload);
  }

  deleteModel(id: number | string): Observable<{ success?: boolean; message?: string }> {
    return this.apiService.delete<{ success?: boolean; message?: string }>(`deleteAIModel?id=${id}`);
  }
}
