import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-builds',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss'],
})
export class BuildsComponent {
  columns = ['Build ID', 'User', 'Project', 'Status', 'Time Taken', 'Credits Used', 'Timestamp'];
  rows = [
    {
      'Build ID': 'BLD-90421',
      User: 'Aarav',
      Project: 'Brand Studio',
      Status: 'Success',
      'Time Taken': '2m 11s',
      'Credits Used': '120',
      Timestamp: '2026-05-06 10:12',
    },
    {
      'Build ID': 'BLD-90420',
      User: 'Ira',
      Project: 'SalesOps AI',
      Status: 'Failed',
      'Time Taken': '1m 09s',
      'Credits Used': '45',
      Timestamp: '2026-05-06 10:04',
    },
    {
      'Build ID': 'BLD-90419',
      User: 'Rohan',
      Project: 'Doc Assist',
      Status: 'Success',
      'Time Taken': '3m 22s',
      'Credits Used': '180',
      Timestamp: '2026-05-06 09:56',
    },
  ];
}
