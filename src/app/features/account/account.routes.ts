import { Routes } from '@angular/router';
import { ChangePasswordComponent } from './components/change-password.component';
import { MyProfileComponent } from './components/my-profile.component';

export default [
  { path: 'profile', component: MyProfileComponent },
  { path: 'change-password', component: ChangePasswordComponent },
] satisfies Routes;
