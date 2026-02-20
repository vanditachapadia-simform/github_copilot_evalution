import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { 
  validateCreateTask, 
  validateUpdateTask, 
  validateTaskId, 
  validateQueryParams,
  ValidationUtils
} from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/tasks/stats
 * @description Get task statistics
 * @access Public
 */
router.get('/stats', TaskController.getTaskStats);

/**
 * @route GET /api/tasks/search
 * @description Search tasks by title or description
 * @access Public
 * @query q - search query string
 */
router.get('/search', TaskController.searchTasks);

/**
 * @route GET /api/tasks/status/:status
 * @description Get tasks by status
 * @access Public
 * @params status - task status (todo, in-progress, completed)
 */
router.get('/status/:status', TaskController.getTasksByStatus);

/**
 * @route GET /api/tasks
 * @description Get all tasks with optional filtering
 * @access Public
 * @query status - filter by status
 * @query priority - filter by priority  
 * @query search - search in title/description
 */
router.get('/', validateQueryParams, TaskController.getAllTasks);

/**
 * @route GET /api/tasks/:id
 * @description Get a single task by ID
 * @access Public
 * @params id - task ID
 */
router.get('/:id', validateTaskId, TaskController.getTaskById);

/**
 * @route POST /api/tasks
 * @description Create a new task
 * @access Public
 * @body CreateTaskRequest
 */
router.post('/', validateCreateTask, TaskController.createTask);

/**
 * @route PUT /api/tasks/:id
 * @description Update a task (full update)
 * @access Public
 * @params id - task ID
 * @body UpdateTaskRequest
 */
router.put('/:id', validateTaskId, validateUpdateTask, TaskController.updateTaskFull);

/**
 * @route PATCH /api/tasks/:id
 * @description Partially update a task
 * @access Public
 * @params id - task ID
 * @body Partial<UpdateTaskRequest>
 */
router.patch('/:id', validateTaskId, validateUpdateTask, TaskController.updateTaskPartial);

/**
 * @route PATCH /api/tasks/:id/status
 * @description Update task status only
 * @access Public
 * @params id - task ID
 * @body { status: TaskStatus }
 */
router.patch('/:id/status', validateTaskId, (req, res, next) => {
  // Custom validation for status update
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      error: {
        message: 'Status is required',
        statusCode: 400
      }
    });
  }

  const statusError = ValidationUtils.validateTaskStatus(status);
  if (statusError) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        errors: [statusError]
      }
    });
  }

  next();
}, TaskController.updateTaskStatus);

/**
 * @route DELETE /api/tasks/:id
 * @description Delete a task
 * @access Public
 * @params id - task ID
 */
router.delete('/:id', validateTaskId, TaskController.deleteTask);

/**
 * @route PATCH /api/tasks/:id/reorder
 * @description Reorder a single task
 * @access Public
 * @params id - task ID
 * @body newOrder - new order position (number)
 */
router.patch('/:id/reorder', validateTaskId, (req, res, next) => {
  const { newOrder } = req.body;
  
  if (typeof newOrder !== 'number' || !Number.isInteger(newOrder) || newOrder < 1) {
    return res.status(400).json({
      error: {
        message: 'newOrder must be a positive integer'
      }
    });
  }
  
  next();
}, TaskController.reorderTask);

/**
 * @route PATCH /api/tasks/bulk-reorder
 * @description Bulk reorder tasks (for drag and drop)
 * @access Public
 * @body tasks - array of {id: string, order: number}
 */
router.patch('/bulk-reorder', (req, res, next) => {
  const { tasks } = req.body;
  
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: {
        message: 'tasks must be a non-empty array'
      }
    });
  }
  
  // Validate each task in the array
  for (const task of tasks) {
    if (!task.id || typeof task.id !== 'string' || 
        typeof task.order !== 'number' || !Number.isInteger(task.order) || task.order < 1) {
      return res.status(400).json({
        error: {
          message: 'each task must have a valid id (string) and order (positive integer)'
        }
      });
    }
  }
  
  next();
}, TaskController.bulkReorderTasks);

export default router;