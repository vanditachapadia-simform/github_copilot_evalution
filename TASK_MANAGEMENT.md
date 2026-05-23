# Task Management Feature

## Overview

The Task Management feature provides a full-stack solution for creating, viewing, updating, deleting, searching, and reordering tasks. It includes:

- A RESTful backend API (Node.js/Express, in-memory storage)
- An Angular frontend with forms, list views, drag-and-drop, and offline support
- End-to-end integration for seamless task management

---

## Backend API

### Task Model

```ts
// backend/src/models/task.model.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}
```

### Endpoints

#### 1. Get All Tasks

- **GET** `/api/tasks`
- Query params: `status`, `priority`, `search`, `page`, `limit`, `sort`, `order`
- Returns paginated, filtered, and sorted tasks.

**Sample Request:**
```http
GET /api/tasks?status=todo&priority=high&page=1&limit=5&sort=createdAt&order=desc
```

**Sample Response:**
```json
{
  "data": [
    {
      "id": "1",
      "title": "Implement user authentication",
      "description": "Create login and registration functionality for the application",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-03-01T00:00:00.000Z",
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-20T10:00:00.000Z",
      "order": 1
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 5,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Tasks retrieved successfully",
  "filters": { "status": "todo", "priority": "high" },
  "sorting": { "field": "createdAt", "order": "desc" }
}
```

---

#### 2. Get Task by ID

- **GET** `/api/tasks/:id`

**Sample Request:**
```http
GET /api/tasks/1
```

**Sample Response:**
```json
{
  "data": {
    "id": "1",
    "title": "Implement user authentication",
    "description": "Create login and registration functionality for the application",
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z",
    "order": 1
  },
  "message": "Task retrieved successfully"
}
```

---

#### 3. Create Task

- **POST** `/api/tasks`
- Body: `title`, `description`, `status`, `priority`, `dueDate`, `order?`

**Sample Request:**
```json
{
  "title": "Write API documentation",
  "description": "Document all REST API endpoints with examples",
  "status": "todo",
  "priority": "low",
  "dueDate": "2026-03-05T00:00:00.000Z"
}
```

**Sample Response:**
```json
{
  "data": {
    "id": "5",
    "title": "Write API documentation",
    "description": "Document all REST API endpoints with examples",
    "status": "todo",
    "priority": "low",
    "dueDate": "2026-03-05T00:00:00.000Z",
    "createdAt": "2026-02-21T12:00:00.000Z",
    "updatedAt": "2026-02-21T12:00:00.000Z",
    "order": 5
  },
  "message": "Task created successfully"
}
```

---

#### 4. Update Task (Full)

- **PUT** `/api/tasks/:id`
- Body: All fields required

#### 5. Update Task (Partial)

- **PATCH** `/api/tasks/:id`
- Body: Any subset of fields

**Sample Request:**
```json
{
  "status": "completed"
}
```

**Sample Response:**
```json
{
  "data": { /* updated task object */ },
  "message": "Task updated successfully"
}
```

---

#### 6. Delete Task

- **DELETE** `/api/tasks/:id`

**Sample Response:**
```json
{
  "message": "Task deleted successfully"
}
```

---

#### 7. Search Tasks

- **GET** `/api/tasks/search?q=term`

---

#### 8. Get Tasks by Status

- **GET** `/api/tasks/status/:status`

---

#### 9. Update Task Status

- **PATCH** `/api/tasks/:id/status`
- Body: `{ "status": "in-progress" }`

---

#### 10. Reorder Tasks

- **PATCH** `/api/tasks/:id/reorder`
- Body: `{ "newOrder": 2 }`

- **PATCH** `/api/tasks/bulk-reorder`
- Body: `{ "tasks": [ { "id": "1", "order": 1 }, ... ] }`

---

#### 11. Get Task Statistics

- **GET** `/api/tasks/stats`

**Sample Response:**
```json
{
  "data": {
    "total": 4,
    "todo": 2,
    "inProgress": 1,
    "completed": 1
  },
  "message": "Task statistics retrieved successfully"
}
```

---

### Error Response Example

```json
{
  "error": {
    "message": "Task with ID 99 not found",
    "statusCode": 404
  }
}
```

---

## Frontend (Angular)

### UI Features

- Task list with pagination, sorting, and filtering
- Create/Edit task modal form with validation
- Drag-and-drop reordering
- Status and priority badges
- Task statistics dashboard
- Offline support (local cache, pending actions)
- Error and loading states

### Main Components

- `TaskManagementComponent`: Main dashboard, list, filters, pagination, drag-and-drop
- `TaskFormComponent`: Modal form for create/edit
- `TaskItemComponent`: Individual task display, status change, edit/delete

### API Integration

- All API calls are handled by `TaskService` (`frontend/src/app/services/task.service.ts`)
- Uses Angular `HttpClient` for REST calls
- Handles offline mode with localStorage and pending actions queue

**Example: Fetch Tasks**
```ts
this.taskService.getTasks({ page: 1, limit: 10, sort: 'createdAt', order: 'desc' })
  .subscribe(response => {
    this.tasks = response.data;
    this.pagination = response.pagination;
  });
```

**Example: Create Task**
```ts
this.taskService.createTask(newTaskData).subscribe(task => {
  // handle created task
});
```

---

## Full-Stack Flow

1. **User interacts with UI** (e.g., creates a task in the form)
2. **Frontend calls TaskService** to make an HTTP request to the backend API
3. **Backend processes the request** (validates, updates in-memory store, returns result)
4. **Frontend updates UI** with the response (shows new/updated task, error, etc.)
5. **Offline support:** If offline, actions are queued and synced when back online

---

## Setup Steps

### Prerequisites

- Node.js v18+
- npm
- Angular CLI (`npm install -g @angular/cli`)

### Backend

```bash
cd backend
npm install
npm run build
npm start
# API runs at http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm start
# UI runs at http://localhost:4200
```

---

## Example API Requests

### Create Task

```http
POST /api/tasks
Content-Type: application/json

{
  "title": "New Task",
  "description": "Details about the new task",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2026-03-10T00:00:00.000Z"
}
```

### Update Task

```http
PATCH /api/tasks/1
Content-Type: application/json

{
  "status": "completed"
}
```

### Delete Task

```http
DELETE /api/tasks/1
```

---

## Summary

- **Backend:** RESTful API, in-memory, CRUD, search, reorder, stats
- **Frontend:** Angular, forms, list, drag-and-drop, offline, error/loading states
- **Integration:** All features work together for a seamless developer and user experience

---

For more details, see the code in the `backend/` and `frontend/` folders.
