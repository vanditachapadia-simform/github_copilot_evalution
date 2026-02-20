import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { OfflineService } from '../../services/offline.service';
import { 
  Task, 
  TaskStatus, 
  TaskQueryParams,
  PaginationMeta,
  SortableFields,
  SortOrder
} from '../../models/task.model';

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html'
})
export class TaskManagementComponent implements OnInit {
  tasks: Task[] = [];
  selectedTask: Task | null = null;
  isFormVisible = false;
  isLoading = false;
  error: string | null = null;
  
  // Filtering
  statusFilter: TaskStatus | 'all' = 'all';
  searchTerm = '';
  
  // Pagination
  paginationMeta: PaginationMeta | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50];
  
  // Sorting
  sortField: SortableFields = 'createdAt';
  sortOrder: SortOrder = 'desc';
  sortableFields: { value: SortableFields; label: string }[] = [
    { value: 'order', label: 'Custom Order' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ];
  
  // For template usage
  Math = Math;
  
  // Drag and drop state
  isDragging = false;
  dragPreviewText = '';
  
  taskStats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0
  };

  constructor(
    private taskService: TaskService,
    private offlineService: OfflineService
  ) {}

  // Getter properties for template
  get totalItems(): number {
    return this.paginationMeta?.totalItems || 0;
  }

  get totalPages(): number {
    return this.paginationMeta?.totalPages || 0;
  }

  get hasNextPage(): boolean {
    return this.paginationMeta?.hasNext || false;
  }

  get hasPreviousPage(): boolean {
    return this.paginationMeta?.hasPrev || false;
  }

  get isOnline(): boolean {
    return this.offlineService.isOnline();
  }

  ngOnInit(): void {
    this.loadTasks();
    this.subscribeToServiceState();
  }

  private subscribeToServiceState(): void {
    this.taskService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
    });

    this.taskService.pagination$.subscribe(pagination => {
      this.paginationMeta = pagination;
      if (pagination) {
        this.currentPage = pagination.currentPage;
        this.itemsPerPage = pagination.itemsPerPage;
      }
    });

    this.taskService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.taskService.error$.subscribe(error => {
      this.error = error;
    });
  }

  loadTasks(): void {
    const params: TaskQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: this.sortField,
      order: this.sortOrder
    };

    // Add filters if set
    if (this.statusFilter !== 'all') {
      params.status = this.statusFilter;
    }

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.taskService.getTasks(params).subscribe({
      next: (response) => {
        this.tasks = response.data;
        this.paginationMeta = response.pagination;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        this.paginationMeta = {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        };
      }
    });
  }

  showCreateForm(): void {
    this.selectedTask = null;
    this.isFormVisible = true;
  }

  editTask(task: Task): void {
    this.selectedTask = task;
    this.isFormVisible = true;
  }

  closeForm(): void {
    this.isFormVisible = false;
    this.selectedTask = null;
  }

  onTaskUpdated(task: Task): void {
    this.closeForm();
    this.loadTasks(); // Refresh current page
  }

  onTaskCreated(task: Task): void {
    this.closeForm();
    this.loadTasks(); // Refresh current page
  }

  deleteTask(task: Task): void {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.loadTasks(); // Refresh current page
        }
      });
    }
  }

  updateTaskStatus(task: Task, newStatus: TaskStatus): void {
    this.taskService.updateTaskStatus(task.id!, newStatus).subscribe({
      next: () => {
        this.loadTasks(); // Refresh current page
      }
    });
  }

  filterByStatus(status: TaskStatus | 'all'): void {
    this.statusFilter = status;
    this.currentPage = 1; // Reset to first page
    this.loadTasks();
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page
    this.loadTasks();
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTasks();
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadTasks();
  }

  // Sorting methods
  onSortChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadTasks();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.onSortChange();
  }

  // Pagination helper methods
  getPageNumbers(): number[] {
    if (!this.paginationMeta) return [];
    
    const totalPages = this.paginationMeta.totalPages;
    const currentPage = this.paginationMeta.currentPage;
    const pages: number[] = [];
    
    // Show up to 5 page numbers around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get filteredTasks(): Task[] {
    return this.tasks; // Tasks are already filtered by the backend
  }

  dismissError(): void {
    this.error = null;
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id || index.toString();
  }

  private updateStats(): void {
    this.taskStats = {
      total: this.tasks.length,
      todo: this.tasks.filter(t => t.status === 'todo').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length
    };
  }

  // Drag and Drop Methods
  onDragStarted(task: Task): void {
    this.isDragging = true;
    this.dragPreviewText = task.title;
  }

  onDragEnded(): void {
    this.isDragging = false;
    this.dragPreviewText = '';
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // Create a copy of the tasks array for manipulation
    const tasksCopy = [...this.tasks];
    
    // Move the item in the local array
    moveItemInArray(tasksCopy, event.previousIndex, event.currentIndex);
    
    // Update the order values based on new positions
    const reorderedTasks = tasksCopy.map((task, index) => ({
      id: task.id!,
      order: index + 1
    }));

    // Optimistically update the local state
    this.tasks = tasksCopy.map((task, index) => ({
      ...task,
      order: index + 1
    }));

    // Persist the changes to the backend
    this.taskService.bulkReorderTasks(reorderedTasks).subscribe({
      next: (updatedTasks) => {
        // Backend has confirmed the order, update with any corrections
        this.tasks = updatedTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
        this.updateStats();
      },
      error: (error) => {
        console.error('Error reordering tasks:', error);
        // Reload tasks to get the correct state from the server
        this.loadTasks();
      }
    });

    this.onDragEnded();
  }

  onDragMoved(event: any): void {
    // Optional: Add visual feedback for drag position
  }
}