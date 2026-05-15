import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NotificationPopupComponent } from './shared/components/notification-popup/notification-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationPopupComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
