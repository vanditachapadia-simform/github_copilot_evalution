import { Request, Response, NextFunction } from 'express';
import { taskStore } from '../services/taskStore.service';
import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskStatus, 
  TaskPriority,
  SortableFields,
  SortOrder,
  TaskReorderRequest,
  BulkReorderRequest
} from '../models/task.model';

export class TaskController {
  /**
   * Get all tasks with optional filtering, pagination, and sorting
   * GET /api/tasks?status=todo&priority=high&search=term&page=1&limit=10&sort=createdAt&order=desc
   */
  static async getAllTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        status, 
        priority, 
        search,
        page = '1',
        limit = '10',
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      // Parse pagination parameters
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100); // Max 100 items per page
      const sortField = (sort as SortableFields) || 'createdAt';
      const sortOrder = (order as SortOrder) || 'desc';

      // Build filters object
      const filters: {
        status?: TaskStatus;
        priority?: TaskPriority;
        search?: string;
      } = {};

      if (status && typeof status === 'string') {
        filters.status = status as TaskStatus;
      }

      if (priority && typeof priority === 'string') {
        filters.priority = priority as TaskPriority;
      }

      if (search && typeof search === 'string') {
        filters.search = search.trim();
      }

      // Get paginated and sorted tasks
      const result = taskStore.getTasksPaginated(
        pageNum,
        limitNum,
        sortField,
        sortOrder,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(200).json({
        data: result.tasks,
        pagination: result.pagination,
        message: 'Tasks retrieved successfully',
        filters: filters,
        sorting: {
          field: sortField,
          order: sortOrder
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single task by ID
   * GET /api/tasks/:id
   */
  static async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const task = taskStore.getTaskById(id);

      if (!task) {
        res.status(404).json({
          error: {
            message: `Task with ID ${id} not found`,
            statusCode: 404
          }
        });
        return;
      }

      res.status(200).json({
        data: task,
        message: 'Task retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new task
   * POST /api/tasks
   */
  static async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskData: CreateTaskRequest = req.body;
      const newTask = taskStore.createTask(taskData);

      res.status(201).json({
        data: newTask,
        message: 'Task created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing task
   * PUT /api/tasks/:id (full update)
   */
  static async updateTaskFull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateTaskRequest = req.body;

      if (!taskStore.taskExists(id)) {
        res.status(404).json({
          error: {
            message: `Task with ID ${id} not found`,
            statusCode: 404
          }
        });
        return;
      }

      const updatedTask = taskStore.updateTask(id, updateData);

      if (!updatedTask) {
        res.status(500).json({
          error: {
            message: 'Failed to update task',
            statusCode: 500
          }
        });
        return;
      }

      res.status(200).json({
        data: updatedTask,
        message: 'Task updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Partially update an existing task
   * PATCH /api/tasks/:id (partial update)
   */
  static async updateTaskPartial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateTaskRequest = req.body;

      if (!taskStore.taskExists(id)) {
        res.status(404).json({
          error: {
            message: `Task with ID ${id} not found`,
            statusCode: 404
          }
        });
        return;
      }

      const updatedTask = taskStore.updateTask(id, updateData);

      if (!updatedTask) {
        res.status(500).json({
          error: {
            message: 'Failed to update task',
            statusCode: 500
          }
        });
        return;
      }

      res.status(200).json({
        data: updatedTask,
        message: 'Task updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a task
   * DELETE /api/tasks/:id
   */
  static async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!taskStore.taskExists(id)) {
        res.status(404).json({
          error: {
            message: `Task with ID ${id} not found`,
            statusCode: 404
          }
        });
        return;
      }

      const deleted = taskStore.deleteTask(id);

      if (!deleted) {
        res.status(500).json({
          error: {
            message: 'Failed to delete task',
            statusCode: 500
          }
        });
        return;
      }

      res.status(200).json({
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task statistics
   * GET /api/tasks/stats
   */
  static async getTaskStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = taskStore.getTaskStats();

      res.status(200).json({
        data: stats,
        message: 'Task statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update task status only
   * PATCH /api/tasks/:id/status
   */
  static async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({
          error: {
            message: 'Status is required',
            statusCode: 400
          }
        });
        return;
      }

      if (!taskStore.taskExists(id)) {
        res.status(404).json({
          error: {
            message: `Task with ID ${id} not found`,
            statusCode: 404
          }
        });
        return;
      }

      const updatedTask = taskStore.updateTask(id, { status });

      if (!updatedTask) {
        res.status(500).json({
          error: {
            message: 'Failed to update task status',
            statusCode: 500
          }
        });
        return;
      }

      res.status(200).json({
        data: updatedTask,
        message: 'Task status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tasks by status
   * GET /api/tasks/status/:status
   */
  static async getTasksByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      
      // Validate status parameter
      const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'completed'];
      if (!validStatuses.includes(status as TaskStatus)) {
        res.status(400).json({
          error: {
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            statusCode: 400
          }
        });
        return;
      }

      const tasks = taskStore.getTasksByStatus(status as TaskStatus);

      res.status(200).json({
        data: tasks,
        message: `Tasks with status '${status}' retrieved successfully`,
        count: tasks.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search tasks
   * GET /api/tasks/search?q=searchterm
   */
  static async searchTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({
          error: {
            message: 'Search query (q) is required and must be a non-empty string',
            statusCode: 400
          }
        });
        return;
      }

      if (q.length > 100) {
        res.status(400).json({
          error: {
            message: 'Search query cannot exceed 100 characters',
            statusCode: 400
          }
        });
        return;
      }

      const tasks = taskStore.searchTasks(q.trim());

      res.status(200).json({
        data: tasks,
        message: 'Search completed successfully',
        count: tasks.length,
        query: q.trim()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder a single task
   * PATCH /api/tasks/:id/reorder
   */
  static async reorderTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { newOrder } = req.body as { newOrder: number };

      if (!id) {
        res.status(400).json({
          error: {
            message: 'Task ID is required'
          }
        });
        return;
      }

      if (typeof newOrder !== 'number' || newOrder < 1) {
        res.status(400).json({
          error: {
            message: 'New order must be a positive number'
          }
        });
        return;
      }

      const updatedTask = taskStore.reorderTask(id, newOrder);
      
      if (!updatedTask) {
        res.status(404).json({
          error: {
            message: `Task with ID ${id} not found`
          }
        });
        return;
      }

      res.status(200).json({
        data: updatedTask,
        message: 'Task reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk reorder tasks (for drag and drop)
   * PATCH /api/tasks/bulk-reorder
   */
  static async bulkReorderTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tasks } = req.body as BulkReorderRequest;

      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        res.status(400).json({
          error: {
            message: 'Tasks array is required and must not be empty'
          }
        });
        return;
      }

      // Validate each task in the array
      for (const task of tasks) {
        if (!task.id || typeof task.order !== 'number' || task.order < 1) {
          res.status(400).json({
            error: {
              message: 'Each task must have a valid ID and positive order number'
            }
          });
          return;
        }
      }

      const updatedTasks = taskStore.bulkReorderTasks(tasks);
      
      res.status(200).json({
        data: updatedTasks,
        message: `Successfully reordered ${updatedTasks.length} tasks`
      });
    } catch (error) {
      next(error);
    }
  }
}