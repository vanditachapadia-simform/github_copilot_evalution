export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  order?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface TaskResponse {
  data: Task;
  message: string;
}

export interface TaskListResponse {
  data: Task[];
  message: string;
  count: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: {
    field: string;
    message: string;
  }[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  message: string;
}

export type SortableFields = 'id' | 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'order';
export type SortOrder = 'asc' | 'desc';

export interface TaskReorderRequest {
  taskId: string;
  newOrder: number;
}

export interface BulkReorderRequest {
  tasks: { id: string; order: number }[];
}