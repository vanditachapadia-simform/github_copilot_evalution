export interface Task {
  id?: string;
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

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
  updatedAt?: string;
}

export interface TaskApiResponse {
  tasks?: Task[];
  task?: Task;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TaskListResponse {
  data: Task[];
  pagination: PaginationMeta;
  message: string;
  filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface TaskResponse {
  data: Task;
  message: string;
}

export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
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