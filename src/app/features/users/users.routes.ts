import { Routes } from '@angular/router';
import { UserDetailComponent } from './components/user-detail.component';
import { UsersComponent } from './components/users.component';

export default [
  { path: '', component: UsersComponent },
  { path: ':id', component: UserDetailComponent },
] satisfies Routes;
