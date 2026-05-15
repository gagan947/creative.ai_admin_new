import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-subscriptions-billing',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './subscriptions-billing.component.html',
  styleUrls: ['./subscriptions-billing.component.scss'],
})
export class SubscriptionsBillingComponent {
  columns = ['User', 'Plan', 'Amount', 'Billing Cycle', 'Last Payment', 'Next Payment'];
  rows = [
    {
      User: 'Aarav',
      Plan: 'Standard Plan',
      Amount: '₹3,999',
      'Billing Cycle': 'Monthly',
      'Last Payment': '2026-05-01',
      'Next Payment': '2026-06-01',
    },
    {
      User: 'Ira',
      Plan: 'Free Plan',
      Amount: '₹0',
      'Billing Cycle': 'Monthly',
      'Last Payment': '2026-04-29',
      'Next Payment': '2026-05-29',
    },
    {
      User: 'Rohan',
      Plan: 'Enterprise Plan',
      Amount: '₹15,999',
      'Billing Cycle': 'Yearly',
      'Last Payment': '2026-01-10',
      'Next Payment': '2027-01-10',
    },
  ];
}
