import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-modal.component.html',
  styleUrls: ['./ui-modal.component.scss'],
})
export class UiModalComponent {
  @Input() open = false;
  @Input() title = 'Modal';
  @Output() closed = new EventEmitter<void>();
}
