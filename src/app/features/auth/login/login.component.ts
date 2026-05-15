import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loading = false;
  isPasswordVisible = false;
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {
    this.form = this.fb.nonNullable.group({
      email: [localStorage.getItem('SavedEmail') || '', [Validators.required, Validators.email]],
      password: [localStorage.getItem('SavedPassword') || '', [Validators.required]],
      rememberMe: [localStorage.getItem('RememberMe') === 'true'],
    });
  }

  ngOnInit(): void {
    this.logout();
  }

  logout(): void {
    localStorage.removeItem('userRole');
    this.authService.logout();
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notificationService.warning('Please enter a valid email and password.');
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();
    this.loading = true;

    this.authService
      .login({ email, password })
      .subscribe({
        next: (response) => {
          this.stopLoading();

          if (!response.success) {
            this.notificationService.error(response.message || 'Login failed.');
            return;
          }

          if (response.data?.users?.[0]) {
            localStorage.setItem('userInfo', JSON.stringify(response.data.users[0]));
          }

          if (rememberMe) {
            localStorage.setItem('SavedEmail', email);
            localStorage.setItem('SavedPassword', password);
            localStorage.setItem('RememberMe', 'true');
          } else {
            localStorage.removeItem('SavedEmail');
            localStorage.removeItem('SavedPassword');
            localStorage.removeItem('RememberMe');
          }

          this.notificationService.success(response.message || 'Login successful.');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.stopLoading();
        },
      });
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}
