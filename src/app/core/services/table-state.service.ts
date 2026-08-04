import { Injectable } from '@angular/core';

export interface TableState<T = Record<string, unknown>> {
  page: number;
  pageSize: number;
  filters?: T;
}

@Injectable({
  providedIn: 'root',
})
export class TableStateService {
  private readonly stateMap = new Map<string, TableState<any>>();

  getState<T = Record<string, unknown>>(key: string): TableState<T> | undefined {
    return this.stateMap.get(key) as TableState<T> | undefined;
  }

  setState<T = Record<string, unknown>>(key: string, state: TableState<T>): void {
    this.stateMap.set(key, state);
  }

  clearState(key: string): void {
    this.stateMap.delete(key);
  }
}
