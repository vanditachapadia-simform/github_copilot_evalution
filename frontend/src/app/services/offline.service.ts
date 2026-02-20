import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number;
  pendingActions: number;
  syncError: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: 0,
    pendingActions: 0,
    syncError: null
  });

  public syncStatus$ = this.syncStatusSubject.asObservable();
  public isOnline$ = this.syncStatus$.pipe(map(status => status.isOnline));

  constructor() {
    this.initializeNetworkListeners();
  }

  /**
   * Initialize network connectivity listeners
   */
  private initializeNetworkListeners(): void {
    // Listen to browser online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    // Combine events and start with current status
    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        debounceTime(100), // Debounce rapid changes
        distinctUntilChanged()
      )
      .subscribe(isOnline => {
        this.updateOnlineStatus(isOnline);
      });

    // Additional connectivity check with API ping
    this.setupPeriodicConnectivityCheck();
  }

  /**
   * Set up periodic connectivity checks
   */
  private setupPeriodicConnectivityCheck(): void {
    setInterval(() => {
      if (navigator.onLine) {
        this.checkAPIConnectivity();
      }
    }, 30000); // Check every 30 seconds when browser says we're online
  }

  /**
   * Check actual API connectivity
   */
  private async checkAPIConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const isConnected = response.ok;
      if (this.syncStatusSubject.value.isOnline !== isConnected) {
        this.updateOnlineStatus(isConnected);
      }
      return isConnected;
    } catch {
      if (this.syncStatusSubject.value.isOnline) {
        this.updateOnlineStatus(false);
      }
      return false;
    }
  }

  /**
   * Update online status
   */
  private updateOnlineStatus(isOnline: boolean): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({
      ...currentStatus,
      isOnline,
      syncError: isOnline ? null : currentStatus.syncError
    });
  }

  /**
   * Update sync status
   */
  updateSyncStatus(updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({
      ...currentStatus,
      ...updates
    });
  }

  /**
   * Set syncing state
   */
  setSyncing(isSyncing: boolean, error?: string | null): void {
    this.updateSyncStatus({
      isSyncing,
      syncError: error || null
    });
  }

  /**
   * Update pending actions count
   */
  updatePendingCount(count: number): void {
    this.updateSyncStatus({ pendingActions: count });
  }

  /**
   * Mark successful sync
   */
  markSyncSuccess(): void {
    this.updateSyncStatus({
      isSyncing: false,
      lastSync: Date.now(),
      syncError: null
    });
  }

  /**
   * Mark sync error
   */
  markSyncError(error: string): void {
    this.updateSyncStatus({
      isSyncing: false,
      syncError: error
    });
  }

  /**
   * Get current online status
   */
  isOnline(): boolean {
    return this.syncStatusSubject.value.isOnline;
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatusSubject.value;
  }

  /**
   * Force connectivity check
   */
  async forceConnectivityCheck(): Promise<boolean> {
    const isConnected = await this.checkAPIConnectivity();
    return isConnected;
  }

  /**
   * Simulate offline mode (for testing)
   */
  simulateOffline(): void {
    this.updateOnlineStatus(false);
  }

  /**
   * Simulate online mode (for testing)
   */
  simulateOnline(): void {
    this.updateOnlineStatus(true);
  }
}