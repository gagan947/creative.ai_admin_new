import { Injectable } from '@angular/core';
import { Observable, tap, timeout } from 'rxjs';

import { ApiService } from './api.service';
import { TokenService } from './token.service';

interface AuthUser {
  [key: string]: unknown;
}

interface AuthResponseData {
  token: string;
  users: AuthUser[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: AuthResponseData;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly tokenService: TokenService,
  ) {}

  login(payload: { email: string; password: string }): Observable<LoginResponse> {
    return this.apiService
      .post<LoginResponse>('signIn', payload)
      .pipe(
        timeout(15000),
        tap((response) => {
          if (response.success && response.data?.token) {
            this.tokenService.setToken(response.data.token);
          }
        }),
      );
  }

  logout(): void {
    this.tokenService.clearToken();
  }
}
