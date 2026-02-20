import { Injectable } from '@angular/core';
import { Task, PaginationMeta } from '../models/task.model';

export interface CachedTaskData {
  tasks: Task[];
  pagination: PaginationMeta | null;
  lastUpdated: number;
  queryHash?: string;
}

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'reorder';
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TASKS_KEY = 'tasks_cache';
  private readonly PENDING_ACTIONS_KEY = 'pending_actions';
  private readonly SYNC_STATUS_KEY = 'sync_status';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {}

  /**
   * Cache tasks data with metadata
   */
  cacheTasks(tasks: Task[], pagination: PaginationMeta | null, queryHash?: string): void {
    const cacheData: CachedTaskData = {
      tasks,
      pagination,
      lastUpdated: Date.now(),
      queryHash
    };

    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache tasks:', error);
      this.clearOldCache();
    }
  }

  /**
   * Get cached tasks data
   */
  getCachedTasks(queryHash?: string): CachedTaskData | null {
    try {
      const cached = localStorage.getItem(this.TASKS_KEY);
      if (!cached) return null;

      const cacheData: CachedTaskData = JSON.parse(cached);
      
      // Check if cache is still valid
      const isExpired = Date.now() - cacheData.lastUpdated > this.CACHE_DURATION;
      if (isExpired) {
        this.clearTasksCache();
        return null;
      }

      // Check if query matches (for pagination/filtering)
      if (queryHash && cacheData.queryHash !== queryHash) {
        return null;
      }

      return cacheData;
    } catch (error) {
      console.warn('Failed to get cached tasks:', error);
      this.clearTasksCache();
      return null;
    }
  }

  /**
   * Clear tasks cache
   */
  clearTasksCache(): void {
    localStorage.removeItem(this.TASKS_KEY);
  }

  /**
   * Add a pending action for offline sync
   */
  addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): string {
    const actionId = this.generateActionId();
    const fullAction: PendingAction = {
      id: actionId,
      timestamp: Date.now(),
      ...action
    };

    const existing = this.getPendingActions();
    existing.push(fullAction);
    
    try {
      localStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(existing));
      return actionId;
    } catch (error) {
      console.warn('Failed to store pending action:', error);
      return '';
    }
  }

  /**
   * Get all pending actions
   */
  getPendingActions(): PendingAction[] {
    try {
      const actions = localStorage.getItem(this.PENDING_ACTIONS_KEY);
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.warn('Failed to get pending actions:', error);
      return [];
    }
  }

  /**
   * Remove a pending action after successful sync
   */
  removePendingAction(actionId: string): void {
    const actions = this.getPendingActions();
    const filtered = actions.filter(action => action.id !== actionId);
    
    try {
      localStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to remove pending action:', error);
    }
  }

  /**
   * Clear all pending actions
   */
  clearPendingActions(): void {
    localStorage.removeItem(this.PENDING_ACTIONS_KEY);
  }

  /**
   * Get sync status information
   */
  getSyncStatus(): { lastSync: number; pendingCount: number } {
    try {
      const status = localStorage.getItem(this.SYNC_STATUS_KEY);
      const parsed = status ? JSON.parse(status) : { lastSync: 0, pendingCount: 0 };
      parsed.pendingCount = this.getPendingActions().length;
      return parsed;
    } catch (error) {
      return { lastSync: 0, pendingCount: 0 };
    }
  }

  /**
   * Update sync status
   */
  updateSyncStatus(lastSync: number): void {
    const status = {
      lastSync,
      pendingCount: this.getPendingActions().length
    };

    try {
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.warn('Failed to update sync status:', error);
    }
  }

  /**
   * Check if storage quota is available
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: boolean } {
    if (!this.isStorageAvailable()) {
      return { used: 0, available: false };
    }

    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      return { used: totalSize, available: true };
    } catch {
      return { used: 0, available: false };
    }
  }

  /**
   * Clear old cache data to free up space
   */
  private clearOldCache(): void {
    const keysToCheck = [this.TASKS_KEY, this.SYNC_STATUS_KEY];
    
    keysToCheck.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.lastUpdated && Date.now() - parsed.lastUpdated > this.CACHE_DURATION * 2) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create hash for query parameters (for cache invalidation)
   */
  static createQueryHash(params: any): string {
    return btoa(JSON.stringify(params)).substr(0, 16);
  }
}