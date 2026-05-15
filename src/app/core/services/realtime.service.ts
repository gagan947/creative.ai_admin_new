import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { ActivityEvent } from '../models/admin.models';
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly eventsSubject = new BehaviorSubject<ActivityEvent[]>([
    { action: 'User created project', user: 'Aarav', timestamp: new Date().toISOString(), metadata: 'Project: Brand Site' },
    { action: 'Build failed', user: 'Ira', timestamp: new Date().toISOString(), metadata: 'Timeout on deploy step' },
    { action: 'Credits deducted', user: 'Vivaan', timestamp: new Date().toISOString(), metadata: 'AI Generation -40 credits' },
  ]);
  readonly events$ = this.eventsSubject.asObservable();
  constructor() {
    interval(8000).subscribe(() => {
      const now = new Date().toISOString();
      const pool: ActivityEvent[] = [
        { action: 'Login', user: 'Neha', timestamp: now, metadata: 'IP: 10.0.0.12' },
        { action: 'Build triggered', user: 'Rohan', timestamp: now, metadata: 'Project: Sales Dashboard' },
        { action: 'Payment', user: 'Maya', timestamp: now, metadata: 'Pro Plan renewal' },
      ];
      const next = [pool[Math.floor(Math.random() * pool.length)], ...this.eventsSubject.value].slice(0, 12);
      this.eventsSubject.next(next);
    });
  }
}
