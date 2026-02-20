import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, timer, of } from 'rxjs';
import { catchError, tap, map, switchMap, retry, delay } from 'rxjs/operators';
import { StorageService, PendingAction } from './storage.service';
import { OfflineService } from './offline.service';
import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskStatus,
  TaskListResponse,
  TaskResponse,
  PaginationMeta,
  TaskQueryParams,
  SortableFields,
  SortOrder,
  TaskReorderRequest,
  BulkReorderRequest
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:5000/api';
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private paginationSubject = new BehaviorSubject<PaginationMeta | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public tasks$ = this.tasksSubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private offlineService: OfflineService
  ) {
    this.initializeOfflineSync();
  }

  /**
   * Initialize offline sync functionality
   */
  private initializeOfflineSync(): void {
    // Subscribe to online status changes
    this.offlineService.isOnline$.subscribe(isOnline => {
      if (isOnline) {
        this.syncPendingActions();
      }
    });

    // Update pending actions count
    this.updatePendingActionsCount();
  }

  /**
   * Update pending actions count in offline service
   */
  private updatePendingActionsCount(): void {
    const pendingCount = this.storageService.getPendingActions().length;
    this.offlineService.updatePendingCount(pendingCount);
  }

  /**
   * Get all tasks with pagination, sorting, and offline support
   */
  getTasks(params: TaskQueryParams = {}): Observable<TaskListResponse> {
    this.setLoading(true);
    this.clearError();

    const queryHash = StorageService.createQueryHash(params);

    // Try to get cached data first
    const cached = this.storageService.getCachedTasks(queryHash);
    if (cached && !this.offlineService.isOnline()) {
      // Use cached data if offline
      this.tasksSubject.next(cached.tasks);
      this.paginationSubject.next(cached.pagination);
      this.setLoading(false);
      
      return of({
        data: cached.tasks,
        pagination: cached.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: cached.tasks.length,
          itemsPerPage: 10,
          hasNext: false,
          hasPrev: false
        },
        message: 'Tasks loaded from cache (offline mode)'
      });
    }

    if (!this.offlineService.isOnline()) {
      // No cache and offline - return empty with error
      this.setLoading(false);
      this.errorSubject.next('No internet connection. Please check your connection and try again.');
      
      return of({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNext: false,
          hasPrev: false
        },
        message: 'Offline - no cached data available'
      });
    }

    // Build HTTP parameters
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);

    // Make API call
    return this.http.get<TaskListResponse>(`${this.apiUrl}/tasks`, { params: httpParams }).pipe(
      tap(response => {
        // Update subjects
        this.tasksSubject.next(response.data);
        this.paginationSubject.next(response.pagination);
        
        // Cache the response
        this.storageService.cacheTasks(response.data, response.pagination, queryHash);
        
        this.setLoading(false);
      }),
      catchError(error => {
        // If API fails, try to use cached data
        if (cached) {
          this.tasksSubject.next(cached.tasks);
          this.paginationSubject.next(cached.pagination);
          this.setLoading(false);
          
          // Show warning that cached data is being used
          this.errorSubject.next('Connection error. Showing cached data.');
          
          return of({
            data: cached.tasks,
            pagination: cached.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: cached.tasks.length,
              itemsPerPage: 10,
              hasNext: false,
              hasPrev: false
            },
            message: 'Tasks loaded from cache due to connection error'
          });
        }
        
        return this.handleError(error);
      })
    );
  }

  /**
   * Get a single task by ID
   */
  getTask(id: string): Observable<Task> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TaskResponse>(`${this.apiUrl}/tasks/${id}`).pipe(
      map(response => response.data),
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Create a new task with offline support
   */
  createTask(taskData: CreateTaskRequest): Observable<Task> {
    this.setLoading(true);
    this.clearError();

    if (!this.offlineService.isOnline()) {
      // Create optimistic local task
      const tempId = `temp_${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 1
      };

      // Store pending action
      this.storageService.addPendingAction({
        type: 'create',
        data: taskData
      });

      this.updatePendingActionsCount();
      this.setLoading(false);

      return of(optimisticTask);
    }

    return this.http.post<TaskResponse>(`${this.apiUrl}/tasks`, taskData).pipe(
      map(response => response.data),
      tap(newTask => {
        this.setLoading(false);
      }),
      catchError(error => {
        // If online but API fails, queue for later sync
        this.storageService.addPendingAction({
          type: 'create',
          data: taskData
        });
        this.updatePendingActionsCount();
        return this.handleError(error);
      })
    );
  }

  /**
   * Update an existing task with offline support
   */
  updateTask(id: string, taskData: Partial<UpdateTaskRequest>): Observable<Task> {
    this.setLoading(true);
    this.clearError();

    if (!this.offlineService.isOnline()) {
      // Store pending action
      this.storageService.addPendingAction({
        type: 'update',
        data: { id, ...taskData }
      });

      this.updatePendingActionsCount();
      this.setLoading(false);

      // Return optimistic update (modify local cache)
      const currentTasks = this.tasksSubject.value;
      const updatedTasks = currentTasks.map(task => 
        task.id === id 
          ? { ...task, ...taskData, updatedAt: new Date().toISOString() }
          : task
      );
      this.tasksSubject.next(updatedTasks);

      const updatedTask = updatedTasks.find(t => t.id === id);
      return of(updatedTask!);
    }

    return this.http.patch<TaskResponse>(`${this.apiUrl}/tasks/${id}`, taskData).pipe(
      map(response => response.data),
      tap(updated => {
        this.setLoading(false);
      }),
      catchError(error => {
        // If online but API fails, queue for later sync
        this.storageService.addPendingAction({
          type: 'update',
          data: { id, ...taskData }
        });
        this.updatePendingActionsCount();
        return this.handleError(error);
      })
    );
  }

  /**
   * Delete a task with offline support
   */
  deleteTask(id: string): Observable<void> {
    this.setLoading(true);
    this.clearError();

    if (!this.offlineService.isOnline()) {
      // Store pending action
      this.storageService.addPendingAction({
        type: 'delete',
        data: { id }
      });

      // Optimistically remove from local state
      const currentTasks = this.tasksSubject.value;
      const filteredTasks = currentTasks.filter(task => task.id !== id);
      this.tasksSubject.next(filteredTasks);

      this.updatePendingActionsCount();
      this.setLoading(false);

      return of(void 0);
    }

    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        const currentTasks = this.tasksSubject.value;
        const filteredTasks = currentTasks.filter(task => task.id !== id);
        this.tasksSubject.next(filteredTasks);
        this.setLoading(false);
      }),
      catchError(error => {
        // If online but API fails, queue for later sync
        this.storageService.addPendingAction({
          type: 'delete',
          data: { id }
        });
        this.updatePendingActionsCount();
        return this.handleError(error);
      })
    );
  }

  /**
   * Sync pending actions when back online
   */
  private syncPendingActions(): void {
    const pendingActions = this.storageService.getPendingActions();
    if (pendingActions.length === 0) return;

    this.offlineService.setSyncing(true);

    // Process actions sequentially
    this.processPendingActionsSequentially(pendingActions, 0);
  }

  /**
   * Process pending actions one by one
   */
  private processPendingActionsSequentially(actions: PendingAction[], index: number): void {
    if (index >= actions.length) {
      // All actions processed
      this.offlineService.markSyncSuccess();
      this.updatePendingActionsCount();
      
      // Refresh data from server
      this.getTasks().subscribe();
      return;
    }

    const action = actions[index];
    const processNext = () => this.processPendingActionsSequentially(actions, index + 1);

    switch (action.type) {
      case 'create':
        this.http.post<TaskResponse>(`${this.apiUrl}/tasks`, action.data).pipe(
          tap(() => {
            this.storageService.removePendingAction(action.id);
          }),
          catchError(error => {
            console.error('Sync failed for create action:', error);
            return of(null);
          })
        ).subscribe(() => processNext());
        break;

      case 'update':
        this.http.patch<TaskResponse>(`${this.apiUrl}/tasks/${action.data.id}`, action.data).pipe(
          tap(() => {
            this.storageService.removePendingAction(action.id);
          }),
          catchError(error => {
            console.error('Sync failed for update action:', error);
            return of(null);
          })
        ).subscribe(() => processNext());
        break;

      case 'delete':
        this.http.delete<void>(`${this.apiUrl}/tasks/${action.data.id}`).pipe(
          tap(() => {
            this.storageService.removePendingAction(action.id);
          }),
          catchError(error => {
            console.error('Sync failed for delete action:', error);
            return of(null);
          })
        ).subscribe(() => processNext());
        break;

      case 'reorder':
        this.http.patch<TaskResponse>(`${this.apiUrl}/tasks/bulk-reorder`, action.data).pipe(
          tap(() => {
            this.storageService.removePendingAction(action.id);
          }),
          catchError(error => {
            console.error('Sync failed for reorder action:', error);
            return of(null);
          })
        ).subscribe(() => processNext());
        break;

      default:
        // Unknown action type, remove it
        this.storageService.removePendingAction(action.id);
        processNext();
    }
  }

  /**
   * Manual sync trigger
   */
  forcSync(): Observable<boolean> {
    if (!this.offlineService.isOnline()) {
      return of(false);
    }

    this.syncPendingActions();
    return of(true);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.storageService.clearTasksCache();
    this.storageService.clearPendingActions();
    this.updatePendingActionsCount();
  }

  /**
   * Reorder a single task
   */
  reorderTask(taskId: string, newOrder: number): Observable<Task> {
    this.setLoading(true);
    this.clearError();

    const reorderData: TaskReorderRequest = { taskId, newOrder };
    
    return this.http.patch<TaskResponse>(`${this.apiUrl}/tasks/${taskId}/reorder`, reorderData)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Bulk reorder tasks for drag-and-drop with offline support
   */
  bulkReorderTasks(tasks: { id: string; order: number }[]): Observable<Task[]> {
    this.setLoading(true);
    this.clearError();

    const bulkReorderData: BulkReorderRequest = { tasks };

    if (!this.offlineService.isOnline()) {
      // Store pending action for offline sync
      this.storageService.addPendingAction({
        type: 'reorder',
        data: bulkReorderData
      });

      // Optimistically update local state
      const currentTasks = this.tasksSubject.value;
      const updatedTasks = currentTasks.map(task => {
        const reordered = tasks.find(rt => rt.id === task.id);
        return reordered ? { ...task, order: reordered.order } : task;
      }).sort((a, b) => (a.order || 0) - (b.order || 0));

      this.tasksSubject.next(updatedTasks);
      this.updatePendingActionsCount();
      this.setLoading(false);

      return of(updatedTasks);
    }
    
    return this.http.patch<{ data: Task[]; message: string }>(`${this.apiUrl}/tasks/bulk-reorder`, bulkReorderData)
      .pipe(
        map(response => response.data),
        tap((reorderedTasks) => {
          // Update local state with new order
          const currentTasks = this.tasksSubject.value;
          const updatedTasks = currentTasks.map(task => {
            const reordered = reorderedTasks.find(rt => rt.id === task.id);
            return reordered || task;
          }).sort((a, b) => (a.order || 0) - (b.order || 0));
          
          this.tasksSubject.next(updatedTasks);
          this.setLoading(false);
        }),
        catchError(error => {
          // If online but API fails, queue for later sync
          this.storageService.addPendingAction({
            type: 'reorder',
            data: bulkReorderData
          });
          this.updatePendingActionsCount();
          return this.handleError(error);
        })
      );
  }

  /**
   * Update task status with offline support
   */
  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(id, { status });
  }

  /**
   * Search tasks with pagination
   */
  searchTasks(query: string, params: TaskQueryParams = {}): Observable<TaskListResponse> {
    return this.getTasks({ ...params, search: query });
  }

  /**
   * Get tasks by status with pagination
   */
  getTasksByStatus(status: TaskStatus, params: TaskQueryParams = {}): Observable<TaskListResponse> {
    return this.getTasks({ ...params, status });
  }

  /**
   * Get task statistics
   */
  getTaskStats(): Observable<{total: number, todo: number, inProgress: number, completed: number}> {
    return this.tasks$.pipe(
      map(tasks => ({
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      }))
    );
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Clear error state
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check if the API is running.';
          break;
        case 404:
          errorMessage = 'Task not found.';
          break;
        case 400:
          errorMessage = 'Invalid data provided.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }

    this.errorSubject.next(errorMessage);
    return throwError(() => errorMessage);
  }
}