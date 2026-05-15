import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './activity-logs.component.html',
  styleUrls: ['./activity-logs.component.scss'],
})
export class ActivityLogsComponent {
  columns = ['Action', 'User', 'Timestamp', 'Metadata'];
  rows = [
    {
      Action: 'Login',
      User: 'Aarav',
      Timestamp: '2026-05-06 10:11',
      Metadata: 'Web - Chrome',
    },
    {
      Action: 'Build Trigger',
      User: 'Ira',
      Timestamp: '2026-05-06 10:04',
      Metadata: 'Project: SalesOps AI',
    },
    {
      Action: 'Payment',
      User: 'Rohan',
      Timestamp: '2026-05-06 09:38',
      Metadata: 'Plan: Business renewal',
    },
  ];
}
