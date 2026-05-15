import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-callback-requests',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './callback-requests.component.html',
  styleUrls: ['./callback-requests.component.scss'],
})
export class CallbackRequestsComponent {
  columns = ['Name', 'Email', 'Phone', 'Message', 'Requested At'];
  rows = [
    { Name: 'Priya Verma', Email: 'priya@startup.in', Phone: '+91 99887 55442', Message: 'Need enterprise demo and pricing consultation.', 'Requested At': '2026-05-06 09:41' },
    { Name: 'Aman Rao', Email: 'aman@agency.io', Phone: '+91 99110 22218', Message: 'Call back regarding bulk credits and SLA.', 'Requested At': '2026-05-05 18:14' },
    { Name: 'Sneha Kapoor', Email: 'sneha@designhub.com', Phone: '+91 98101 30220', Message: 'Facing deployment issue, requesting urgent callback.', 'Requested At': '2026-05-05 12:08' },
  ];
}
