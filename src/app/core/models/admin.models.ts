export interface MetricCard {
  label: string;
  value: string;
  trend?: string;
}
export interface ActivityEvent {
  action: string;
  user: string;
  timestamp: string;
  metadata: string;
}
export interface BuildRecord {
  id: string;
  user: string;
  project: string;
  status: 'Success' | 'Failed';
  timeTaken: string;
  creditsUsed: number;
  timestamp: string;
}
