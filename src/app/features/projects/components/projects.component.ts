import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent {
  columns = ['Project Name', 'User', 'Created Date', 'Last Updated', 'Total Builds', 'Status'];
  rows = [
    {
      'Project Name': 'Brand Studio',
      User: 'Aarav',
      'Created Date': '2026-03-01',
      'Last Updated': '2026-05-06',
      'Total Builds': '124',
      Status: 'Active',
    },
    {
      'Project Name': 'SalesOps AI',
      User: 'Ira',
      'Created Date': '2026-02-11',
      'Last Updated': '2026-05-05',
      'Total Builds': '87',
      Status: 'Active',
    },
    {
      'Project Name': 'Doc Assist',
      User: 'Rohan',
      'Created Date': '2025-12-19',
      'Last Updated': '2026-05-01',
      'Total Builds': '45',
      Status: 'Archived',
    },
  ];
}
