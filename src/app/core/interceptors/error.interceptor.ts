import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { TokenService } from '../services/token.service';
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly tokenService: TokenService,
    private readonly router: Router,
  ) {}
  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.tokenService.clearToken();
          this.router.navigate(['/auth/login']);
        }
        const message = error.error?.message || error.message || 'Unexpected API error occurred.';
        this.notificationService.error(message);
        return throwError(() => error);
      }),
    );
  }
}
