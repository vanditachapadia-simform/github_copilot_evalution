import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OfflineService, SyncStatus } from '../../services/offline.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-sync-status',
  template: `
    <div class="sync-status-container" [ngClass]="getStatusClass()">
      <div class="sync-status-content" (click)="toggleDetails()">
        <span class="sync-icon">{{ getStatusIcon() }}</span>
        <span class="sync-text">{{ getStatusText() }}</span>
        <span class="pending-count" *ngIf="syncStatus.pendingActions > 0">
          ({{ syncStatus.pendingActions }})
        </span>
      </div>
      
      <div class="sync-details" *ngIf="showDetails">
        <div class="sync-info">
          <div class="info-row" *ngIf="syncStatus.lastSync > 0">
            <span class="label">Last Sync:</span>
            <span class="value">{{ formatLastSync() }}</span>
          </div>
          <div class="info-row" *ngIf="syncStatus.pendingActions > 0">
            <span class="label">Pending Actions:</span>
            <span class="value">{{ syncStatus.pendingActions }}</span>
          </div>
          <div class="info-row" *ngIf="syncStatus.syncError">
            <span class="label error">Error:</span>
            <span class="value error">{{ syncStatus.syncError }}</span>
          </div>
        </div>
        
        <div class="sync-actions">
          <button 
            class="sync-btn retry-btn"
            *ngIf="!syncStatus.isOnline"
            (click)="checkConnection()"
            [disabled]="checking">
            {{ checking ? 'Checking...' : 'Check Connection' }}
          </button>
          
          <button 
            class="sync-btn force-sync-btn"
            *ngIf="syncStatus.isOnline && syncStatus.pendingActions > 0"
            (click)="forceSync()"
            [disabled]="syncStatus.isSyncing">
            {{ syncStatus.isSyncing ? 'Syncing...' : 'Sync Now' }}
          </button>
          
          <button 
            class="sync-btn clear-btn"
            (click)="clearCache()"
            [disabled]="syncStatus.isSyncing">
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  `
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  syncStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    lastSync: 0,
    pendingActions: 0,
    syncError: null
  };

  showDetails = false;
  checking = false;
  private destroy$ = new Subject<void>();

  constructor(
    private offlineService: OfflineService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.offlineService.syncStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.syncStatus = status;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusClass(): string {
    const baseClass = 'sync-status';
    
    if (!this.syncStatus.isOnline) {
      return `${baseClass} offline`;
    }
    
    if (this.syncStatus.isSyncing) {
      return `${baseClass} syncing`;
    }
    
    if (this.syncStatus.syncError) {
      return `${baseClass} error`;
    }
    
    if (this.syncStatus.pendingActions > 0) {
      return `${baseClass} pending`;
    }
    
    return `${baseClass} online`;
  }

  getStatusIcon(): string {
    if (!this.syncStatus.isOnline) {
      return '⚠️';
    }
    
    if (this.syncStatus.isSyncing) {
      return '🔄';
    }
    
    if (this.syncStatus.syncError) {
      return '❌';
    }
    
    if (this.syncStatus.pendingActions > 0) {
      return '📤';
    }
    
    return '✅';
  }

  getStatusText(): string {
    if (!this.syncStatus.isOnline) {
      return 'Offline Mode';
    }
    
    if (this.syncStatus.isSyncing) {
      return 'Syncing...';
    }
    
    if (this.syncStatus.syncError) {
      return 'Sync Error';
    }
    
    if (this.syncStatus.pendingActions > 0) {
      return 'Changes Ready to Sync';
    }
    
    return 'All Synced';
  }

  formatLastSync(): string {
    if (this.syncStatus.lastSync === 0) {
      return 'Never';
    }
    
    const now = Date.now();
    const diff = now - this.syncStatus.lastSync;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  async checkConnection(): Promise<void> {
    this.checking = true;
    
    try {
      await this.offlineService.forceConnectivityCheck();
    } catch (error) {
      console.error('Connection check failed:', error);
    } finally {
      this.checking = false;
    }
  }

  forceSync(): void {
    if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
      this.taskService.forcSync().subscribe();
    }
  }

  clearCache(): void {
    if (confirm('This will clear all cached data and pending changes. Are you sure?')) {
      this.taskService.clearCache();
      location.reload(); // Refresh to start clean
    }
  }
}