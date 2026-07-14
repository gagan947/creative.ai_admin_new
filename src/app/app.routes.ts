import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.default),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.default),
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then((m) => m.default),
      },
      {
        path: 'projects',
        loadChildren: () => import('./features/projects/projects.routes').then((m) => m.default),
      },
      {
        path: 'builds',
        loadChildren: () => import('./features/builds/builds.routes').then((m) => m.default),
      },
      {
        path: 'deploy',
        loadChildren: () => import('./features/deploy/deploy.routes').then((m) => m.default),
      },
      {
        path: 'callback-requests',
        loadChildren: () => import('./features/callback-requests/callback-requests.routes').then((m) => m.default),
      },
      {
        path: 'usage-credits',
        loadChildren: () => import('./features/usage-credits/usage-credits.routes').then((m) => m.default),
      },
      {
        path: 'subscriptions-billing',
        loadChildren: () => import('./features/subscriptions-billing/subscriptions-billing.routes').then((m) => m.default),
      },
      {
        path: 'analytics',
        loadChildren: () => import('./features/analytics/analytics.routes').then((m) => m.default),
      },
      {
        path: 'activity-logs',
        loadChildren: () => import('./features/activity-logs/activity-logs.routes').then((m) => m.default),
      },
      {
        path: 'errors-failures',
        loadChildren: () => import('./features/errors-failures/errors-failures.routes').then((m) => m.default),
      },
      {
        path: 'blog-management',
        loadChildren: () => import('./features/blog-management/blog-management.routes').then((m) => m.default),
      },
      {
        path: 'model-management',
        loadChildren: () => import('./features/model-management/model-management.routes').then((m) => m.default),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.default),
      },
      {
        path: '',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.default),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
