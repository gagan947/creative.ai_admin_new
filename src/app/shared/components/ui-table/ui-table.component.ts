import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-ui-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-table.component.html',
  styleUrls: ['./ui-table.component.scss'],
})
export class UiTableComponent {
  @Input() columns: string[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() minWidth = '960px';
  @Input() maxHeight = 'none';
  @Input() emptyMessage = '';
  @Input() cellTemplate?: TemplateRef<{ $implicit: Record<string, unknown>; column: string }>;
}
