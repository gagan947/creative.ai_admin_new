import { Component } from '@angular/core';
import { UiButtonComponent, UiTableComponent } from '../../../shared/components';

@Component({
  selector: 'app-usage-credits',
  standalone: true,
  imports: [UiButtonComponent, UiTableComponent],
  templateUrl: './usage-credits.component.html',
  styleUrls: ['./usage-credits.component.scss'],
})
export class UsageCreditsComponent {
  columns = ['User', 'Credits Given', 'Credits Used', 'Remaining'];
  rows = [
    {
      User: 'Aarav',
      'Credits Given': '50,000',
      'Credits Used': '31,230',
      Remaining: '18,770',
    },
    {
      User: 'Ira',
      'Credits Given': '20,000',
      'Credits Used': '11,900',
      Remaining: '8,100',
    },
    {
      User: 'Rohan',
      'Credits Given': '100,000',
      'Credits Used': '84,200',
      Remaining: '15,800',
    },
  ];
}
