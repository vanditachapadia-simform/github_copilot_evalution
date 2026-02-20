import { Request, Response, NextFunction } from 'express';
import { TaskStatus, TaskPriority, SortableFields, SortOrder } from '../models/task.model';

interface ValidationError {
  field: string;
  message: string;
}

export class ValidationUtils {
  /**
   * Validate if string is not empty and within length limits
   */
  static validateString(value: any, minLength: number, maxLength: number, fieldName: string): ValidationError | null {
    if (typeof value !== 'string') {
      return { field: fieldName, message: `${fieldName} must be a string` };
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return { field: fieldName, message: `${fieldName} is required` };
    }

    if (trimmed.length < minLength) {
      return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters long` };
    }

    if (trimmed.length > maxLength) {
      return { field: fieldName, message: `${fieldName} cannot exceed ${maxLength} characters` };
    }

    return null;
  }

  /**
   * Validate task status
   */
  static validateTaskStatus(status: any): ValidationError | null {
    if (typeof status !== 'string') {
      return { field: 'status', message: 'Status must be a string' };
    }

    const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'completed'];
    if (!validStatuses.includes(status as TaskStatus)) {
      return { field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` };
    }

    return null;
  }

  /**
   * Validate task priority
   */
  static validateTaskPriority(priority: any): ValidationError | null {
    if (typeof priority !== 'string') {
      return { field: 'priority', message: 'Priority must be a string' };
    }

    const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority as TaskPriority)) {
      return { field: 'priority', message: `Priority must be one of: ${validPriorities.join(', ')}` };
    }

    return null;
  }

  /**
   * Validate date string
   */
  static validateDate(dateString: any, fieldName: string): ValidationError | null {
    if (typeof dateString !== 'string') {
      return { field: fieldName, message: `${fieldName} must be a valid date string` };
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: `${fieldName} must be a valid date` };
    }

    return null;
  }

  /**
   * Validate MongoDB-style object ID (for this case, just check if it's a non-empty string)
   */
  static validateId(id: any): ValidationError | null {
    if (typeof id !== 'string' || id.trim().length === 0) {
      return { field: 'id', message: 'ID must be a valid non-empty string' };
    }
    return null;
  }
}

/**
 * Middleware to validate create task request
 */
export const validateCreateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, status, priority, dueDate } = req.body;
  const errors: ValidationError[] = [];

  // Validate title
  const titleError = ValidationUtils.validateString(title, 3, 100, 'title');
  if (titleError) errors.push(titleError);

  // Validate description
  const descriptionError = ValidationUtils.validateString(description, 10, 500, 'description');
  if (descriptionError) errors.push(descriptionError);

  // Validate status
  const statusError = ValidationUtils.validateTaskStatus(status);
  if (statusError) errors.push(statusError);

  // Validate priority
  const priorityError = ValidationUtils.validateTaskPriority(priority);
  if (priorityError) errors.push(priorityError);

  // Validate due date
  const dueDateError = ValidationUtils.validateDate(dueDate, 'dueDate');
  if (dueDateError) errors.push(dueDateError);

  // If there are validation errors, return them
  if (errors.length > 0) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        errors
      }
    });
    return;
  }

  // Sanitize the data
  req.body.title = title.trim();
  req.body.description = description.trim();

  next();
};

/**
 * Middleware to validate update task request
 */
export const validateUpdateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, status, priority, dueDate } = req.body;
  const errors: ValidationError[] = [];

  // At least one field should be provided for update
  if (!title && !description && !status && !priority && !dueDate) {
    res.status(400).json({
      error: {
        message: 'At least one field must be provided for update',
        statusCode: 400
      }
    });
    return;
  }

  // Validate title if provided
  if (title !== undefined) {
    const titleError = ValidationUtils.validateString(title, 3, 100, 'title');
    if (titleError) errors.push(titleError);
    else req.body.title = title.trim();
  }

  // Validate description if provided
  if (description !== undefined) {
    const descriptionError = ValidationUtils.validateString(description, 10, 500, 'description');
    if (descriptionError) errors.push(descriptionError);
    else req.body.description = description.trim();
  }

  // Validate status if provided
  if (status !== undefined) {
    const statusError = ValidationUtils.validateTaskStatus(status);
    if (statusError) errors.push(statusError);
  }

  // Validate priority if provided
  if (priority !== undefined) {
    const priorityError = ValidationUtils.validateTaskPriority(priority);
    if (priorityError) errors.push(priorityError);
  }

  // Validate due date if provided
  if (dueDate !== undefined) {
    const dueDateError = ValidationUtils.validateDate(dueDate, 'dueDate');
    if (dueDateError) errors.push(dueDateError);
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        errors
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to validate task ID parameter
 */
export const validateTaskId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  
  const idError = ValidationUtils.validateId(id);
  if (idError) {
    res.status(400).json({
      error: {
        message: 'Invalid task ID',
        statusCode: 400,
        errors: [idError]
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to validate query parameters for filtering, searching, pagination, and sorting
 */
export const validateQueryParams = (req: Request, res: Response, next: NextFunction): void => {
  const { status, priority, search, page, limit, sort, order } = req.query;
  const errors: ValidationError[] = [];

  // Validate status if provided
  if (status && typeof status === 'string') {
    const statusError = ValidationUtils.validateTaskStatus(status);
    if (statusError) errors.push(statusError);
  }

  // Validate priority if provided
  if (priority && typeof priority === 'string') {
    const priorityError = ValidationUtils.validateTaskPriority(priority);
    if (priorityError) errors.push(priorityError);
  }

  // Validate search term if provided
  if (search && typeof search === 'string' && search.trim().length > 100) {
    errors.push({ field: 'search', message: 'Search term cannot exceed 100 characters' });
  }

  // Validate pagination parameters
  if (page && typeof page === 'string') {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    } else if (pageNum > 1000) {
      errors.push({ field: 'page', message: 'Page number cannot exceed 1000' });
    }
  }

  if (limit && typeof limit === 'string') {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer' });
    } else if (limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit cannot exceed 100 items' });
    }
  }

  // Validate sorting parameters
  if (sort && typeof sort === 'string') {
    const validSortFields: SortableFields[] = ['id', 'title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'];
    if (!validSortFields.includes(sort as SortableFields)) {
      errors.push({ 
        field: 'sort', 
        message: `Sort field must be one of: ${validSortFields.join(', ')}` 
      });
    }
  }

  if (order && typeof order === 'string') {
    const validOrders: SortOrder[] = ['asc', 'desc'];
    if (!validOrders.includes(order as SortOrder)) {
      errors.push({ 
        field: 'order', 
        message: `Order must be either 'asc' or 'desc'` 
      });
    }
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    res.status(400).json({
      error: {
        message: 'Invalid query parameters',
        statusCode: 400,
        errors
      }
    });
    return;
  }

  next();
};