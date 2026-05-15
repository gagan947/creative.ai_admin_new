import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-deploy',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.scss'],
})
export class DeployComponent {
  columns = ['User', 'Project ID', 'Project Name', 'Domain', 'Environment', 'Requested At', 'Status'];
  rows = [
    { User: 'Aarav', 'Project ID': 'PRJ-2231', 'Project Name': 'Brand Studio', Domain: 'brand.creativeai.com', Environment: 'Production', 'Requested At': '2026-05-06 10:04', Status: 'Success' },
    { User: 'Ira', 'Project ID': 'PRJ-2198', 'Project Name': 'SalesOps AI', Domain: 'sales.creativeai.app', Environment: 'Staging', 'Requested At': '2026-05-05 14:16', Status: 'Failed' },
    { User: 'Rohan', 'Project ID': 'PRJ-2160', 'Project Name': 'Doc Assist', Domain: 'docs.creativeai.app', Environment: 'Production', 'Requested At': '2026-05-04 16:42', Status: 'Success' },
  ];
}
