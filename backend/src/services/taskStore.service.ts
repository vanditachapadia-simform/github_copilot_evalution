import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority, SortableFields, SortOrder, PaginationMeta, BulkReorderRequest } from '../models/task.model';

class TaskStore {
  private tasks: Map<string, Task> = new Map();
  private currentId = 1;

  constructor() {
    // Initialize with some sample data
    this.seedData();
  }

  private seedData(): void {
    const sampleTasks: Task[] = [
      {
        id: "1",
        title: "Implement user authentication",
        description: "Create login and registration functionality for the application",
        status: "todo",
        priority: "high",
        dueDate: "2026-03-01T00:00:00.000Z",
        createdAt: "2026-02-20T10:00:00.000Z",
        updatedAt: "2026-02-20T10:00:00.000Z",
        order: 1
      },
      {
        id: "2",
        title: "Design dashboard layout",
        description: "Create responsive dashboard with charts and widgets",
        status: "in-progress",
        priority: "medium",
        dueDate: "2026-02-25T00:00:00.000Z",
        createdAt: "2026-02-19T14:30:00.000Z",
        updatedAt: "2026-02-20T09:15:00.000Z",
        order: 2
      },
      {
        id: "3",
        title: "Setup CI/CD pipeline",
        description: "Configure automated testing and deployment pipeline",
        status: "completed",
        priority: "high",
        dueDate: "2026-02-22T00:00:00.000Z",
        createdAt: "2026-02-18T08:00:00.000Z",
        updatedAt: "2026-02-19T16:45:00.000Z",
        order: 3
      },
      {
        id: "4",
        title: "Write API documentation",
        description: "Document all REST API endpoints with examples",
        status: "todo",
        priority: "low",
        dueDate: "2026-03-05T00:00:00.000Z",
        createdAt: "2026-02-20T11:20:00.000Z",
        updatedAt: "2026-02-20T11:20:00.000Z",
        order: 4
      }
    ];

    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
    
    this.currentId = 5; // Next ID after sample data
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get tasks with pagination and sorting
   */
  getTasksPaginated(
    page: number = 1,
    limit: number = 10,
    sortField: SortableFields = 'createdAt',
    sortOrder: SortOrder = 'desc',
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      search?: string;
    }
  ): { tasks: Task[]; pagination: PaginationMeta } {
    let tasks = this.getAllTasks();

    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        tasks = tasks.filter(task =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Apply sorting
    tasks = this.sortTasks(tasks, sortField, sortOrder);

    // Calculate pagination
    const totalItems = tasks.length;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (currentPage - 1) * limit;

    // Apply pagination
    const paginatedTasks = tasks.slice(offset, offset + limit);

    const pagination: PaginationMeta = {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };

    return {
      tasks: paginatedTasks,
      pagination
    };
  }

  /**
   * Sort tasks by specified field and order
   */
  private sortTasks(tasks: Task[], sortField: SortableFields, sortOrder: SortOrder): Task[] {
    return [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'id':
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          // Sort by status priority: todo, in-progress, completed
          const statusOrder = { 'todo': 1, 'in-progress': 2, 'completed': 3 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'priority':
          // Sort by priority: high, medium, low
          const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'order':
          aValue = a.order || 999999; // Tasks without order go to the end
          bValue = b.order || 999999;
          break;
        case 'dueDate':
        case 'createdAt':
        case 'updatedAt':
          aValue = new Date(a[sortField]).getTime();
          bValue = new Date(b[sortField]).getTime();
          break;
        default:
          aValue = a[sortField as keyof Task];
          bValue = b[sortField as keyof Task];
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Get task by ID
   */
  getTaskById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Create a new task
   */
  createTask(taskData: CreateTaskRequest): Task {
    const now = new Date().toISOString();
    
    // If order not provided, set it to be the last task
    const maxOrder = Math.max(0, ...Array.from(this.tasks.values()).map(t => t.order || 0));
    
    const newTask: Task = {
      id: this.generateId(),
      ...taskData,
      order: taskData.order || (maxOrder + 1),
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  /**
   * Update an existing task
   */
  updateTask(id: string, updateData: UpdateTaskRequest): Task | null {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return null;
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  /**
   * Get tasks by priority
   */
  getTasksByPriority(priority: TaskPriority): Task[] {
    return this.getAllTasks().filter(task => task.priority === priority);
  }

  /**
   * Search tasks by title or description
   */
  searchTasks(query: string): Task[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllTasks().filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get task statistics
   */
  getTaskStats() {
    const allTasks = this.getAllTasks();
    return {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    };
  }

  /**
   * Check if task exists
   */
  taskExists(id: string): boolean {
    return this.tasks.has(id);
  }

  /**
   * Clear all tasks (for testing)
   */
  clearTasks(): void {
    this.tasks.clear();
    this.currentId = 1;
  }

  /**
   * Get total count of tasks
   */
  getTaskCount(): number {
    return this.tasks.size;
  }
  /**
   * Reorder a single task
   */
  reorderTask(taskId: string, newOrder: number): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    // Update the task's order
    task.order = newOrder;
    task.updatedAt = new Date().toISOString();
    
    this.tasks.set(taskId, task);
    
    // Adjust other tasks' orders if needed
    this.normalizeOrders();
    
    return task;
  }

  /**
   * Bulk reorder tasks (for drag and drop)
   */
  bulkReorderTasks(taskOrders: { id: string; order: number }[]): Task[] {
    const updatedTasks: Task[] = [];
    const now = new Date().toISOString();

    // Update each task's order
    for (const { id, order } of taskOrders) {
      const task = this.tasks.get(id);
      if (task) {
        task.order = order;
        task.updatedAt = now;
        this.tasks.set(id, task);
        updatedTasks.push(task);
      }
    }

    // Normalize all orders to ensure consistency
    this.normalizeOrders();

    // Return the updated tasks sorted by order
    return updatedTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Normalize task orders to ensure they are sequential (1, 2, 3, etc.)
   */
  private normalizeOrders(): void {
    const allTasks = Array.from(this.tasks.values());
    
    // Sort by current order (or by creation date if no order)
    allTasks.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Reassign sequential orders
    allTasks.forEach((task, index) => {
      task.order = index + 1;
      this.tasks.set(task.id, task);
    });
  }
  private generateId(): string {
    return (this.currentId++).toString();
  }
}

// Singleton instance
export const taskStore = new TaskStore();