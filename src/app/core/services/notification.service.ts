import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  message: string;
  type: NotificationType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  private nextId = 1;

  success(message: string, duration = 3500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4500): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3500): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  private show(message: string, type: NotificationType, duration: number): void {
    const trimmedMessage = message?.trim();
    if (!trimmedMessage) {
      return;
    }

    const notification: AppNotification = {
      id: this.nextId++,
      message: trimmedMessage,
      type,
      duration,
    };

    this.notifications.update((items) => [...items, notification]);
    window.setTimeout(() => this.dismiss(notification.id), duration);
  }
}
