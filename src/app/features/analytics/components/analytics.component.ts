import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent {
  columns = ['Metric', 'Today', 'This Month', 'Trend'];
  rows = [
    {
      Metric: 'DAU',
      Today: '2,149',
      'This Month': '58,210',
      Trend: '+6.4%',
    },
    {
      Metric: 'MAU',
      Today: '12,480',
      'This Month': '12,480',
      Trend: '+8.1%',
    },
    {
      Metric: 'Free -> Paid Conversion',
      Today: '3.2%',
      'This Month': '3.7%',
      Trend: '+0.4%',
    },
  ];
}
