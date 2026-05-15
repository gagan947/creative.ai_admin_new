import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-errors-failures',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './errors-failures.component.html',
  styleUrls: ['./errors-failures.component.scss'],
})
export class ErrorsFailuresComponent {
  columns = ['Error Type', 'User', 'Project', 'Message', 'Time'];
  rows = [
    {
      'Error Type': 'Build Timeout',
      User: 'Ira',
      Project: 'SalesOps AI',
      Message: 'Deploy step exceeded 60s',
      Time: '2026-05-06 10:04',
    },
    {
      'Error Type': 'API Limit',
      User: 'Rohan',
      Project: 'Doc Assist',
      Message: '429 from model endpoint',
      Time: '2026-05-06 09:56',
    },
    {
      'Error Type': 'Payment Webhook',
      User: 'Aarav',
      Project: 'Billing Core',
      Message: 'Signature mismatch',
      Time: '2026-05-06 09:22',
    },
  ];
}
