import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components';

interface UserRow {
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

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, UiButtonComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  users: UserRow[] = [
    { id: 'aarav-malhotra', name: 'Aarav Malhotra', phone: '+91 98765 12121', email: 'aarav@creativeai.com', signupDate: '2026-01-12', plan: 'Standard Plan', creditsUsed: 31230, creditsRemaining: 18770, status: 'Active' },
    { id: 'ira-singh', name: 'Ira Singh', phone: '+91 98220 44331', email: 'ira@creativeai.com', signupDate: '2026-02-03', plan: 'Free Plan', creditsUsed: 11900, creditsRemaining: 8100, status: 'Active' },
    { id: 'rohan-das', name: 'Rohan Das', phone: '+91 98901 56789', email: 'rohan@creativeai.com', signupDate: '2025-11-28', plan: 'Enterprise Plan', creditsUsed: 84200, creditsRemaining: 15800, status: 'Inactive' },
  ];
}
