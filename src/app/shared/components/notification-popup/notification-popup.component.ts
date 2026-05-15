import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AppNotification, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-popup.component.html',
  styleUrl: './notification-popup.component.scss',
})
export class NotificationPopupComponent {
  protected readonly notificationService = inject(NotificationService);

  protected trackById(_: number, item: AppNotification): number {
    return item.id;
  }

  protected dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
