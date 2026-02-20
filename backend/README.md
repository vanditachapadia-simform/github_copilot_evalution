# Backend API - Task Management System

This folder contains a Node.js + Express + TypeScript backend for the Task Management System with RESTful API endpoints.

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Running the Backend

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The backend server will run on **http://localhost:5000** by default.

## API Documentation

### Base URL
```
http://localhost:5000
```

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "ok"
}
```

### Task Endpoints

#### 1. Get All Tasks (with Pagination and Sorting)
```http
GET /api/tasks
```

**Query Parameters:**
- `status` (optional): Filter by status (`todo`, `in-progress`, `completed`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)
- `search` (optional): Search in title and description
- `page` (optional): Page number (default: 1, max: 1000)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sort` (optional): Sort field (`id`, `title`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`) (default: `createdAt`)
- `order` (optional): Sort order (`asc`, `desc`) (default: `desc`)

**Examples:**
```http
# Get first page with 10 items
GET /api/tasks

# Get second page with 5 items
GET /api/tasks?page=2&limit=5

# Sort by title in ascending order
GET /api/tasks?sort=title&order=asc

# Filter todos and sort by due date
GET /api/tasks?status=todo&sort=dueDate&order=asc

# Search with pagination
GET /api/tasks?search=auth&page=1&limit=20

# Combined filtering, sorting, and pagination
GET /api/tasks?status=todo&priority=high&sort=dueDate&order=asc&page=1&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "id": "1",
      "title": "Implement user authentication",
      "description": "Create login and registration functionality",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-03-01T00:00:00.000Z",
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 42,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Tasks retrieved successfully",
  "filters": {
    "status": "todo"
  },
  "sorting": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

#### 2. Get Task by ID
```http
GET /api/tasks/:id
```

**Response:**
```json
{
  "data": {
    "id": "1",
    "title": "Implement user authentication",
    "description": "Create login and registration functionality",
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z"
  },
  "message": "Task retrieved successfully"
}
```

#### 3. Create Task
```http
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description (minimum 10 characters)",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2026-03-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "data": {
    "id": "5",
    "title": "New Task",
    "description": "Task description",
    "status": "todo",
    "priority": "medium",
    "dueDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "2026-02-20T12:00:00.000Z",
    "updatedAt": "2026-02-20T12:00:00.000Z"
  },
  "message": "Task created successfully"
}
```

#### 4. Update Task (Full)
```http
PUT /api/tasks/:id
```

**Request Body:**
```json
{
  "title": "Updated Task",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-02-28T00:00:00.000Z"
}
```

#### 5. Update Task (Partial)
```http
PATCH /api/tasks/:id
```

**Request Body:**
```json
{
  "status": "completed"
}
```

#### 6. Update Task Status Only
```http
PATCH /api/tasks/:id/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

#### 7. Delete Task
```http
DELETE /api/tasks/:id
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

#### 8. Get Task Statistics
```http
GET /api/tasks/stats
```

**Response:**
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

#### 9. Get Tasks by Status
```http
GET /api/tasks/status/:status
```

**Parameters:**
- `status`: `todo`, `in-progress`, or `completed`

#### 10. Search Tasks
```http
GET /api/tasks/search?q=searchterm
```

**Query Parameters:**
- `q`: Search query (required, max 100 characters)

### Pagination & Sorting

#### Pagination Parameters
- `page`: Page number (1-based, default: 1, max: 1000)
- `limit`: Items per page (default: 10, max: 100)

#### Sorting Parameters  
- `sort`: Field to sort by
  - Available fields: `id`, `title`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`
  - Default: `createdAt`
- `order`: Sort direction (`asc` or `desc`, default: `desc`)

#### Pagination Metadata
Every paginated response includes:
```json
{
  "pagination": {
    "currentPage": 1,        // Current page number
    "totalPages": 5,         // Total number of pages
    "totalItems": 42,        // Total number of items
    "itemsPerPage": 10,      // Items per page
    "hasNext": true,         // Has next page
    "hasPrev": false         // Has previous page
  }
}
```

#### Examples
```bash
# Basic pagination
GET /api/tasks?page=2&limit=5

# Sorting
GET /api/tasks?sort=title&order=asc
GET /api/tasks?sort=dueDate&order=desc

# Combined filtering, sorting, and pagination
GET /api/tasks?status=todo&priority=high&sort=dueDate&order=asc&page=1&limit=10
```

### Data Models

#### Task
```typescript
interface Task {
  id: string;
  title: string;           // 3-100 characters
  description: string;     // 10-500 characters
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;         // ISO date string
  createdAt: string;       // ISO date string
  updatedAt: string;       // ISO date string
}
```

### Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "errors": [
      {
        "field": "title",
        "message": "Title must be at least 3 characters long"
      }
    ]
  }
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

### CORS Configuration

The API is configured to accept requests from:
- `http://localhost:4200` (Angular dev server)
- `http://localhost:3000` (React dev server)

### Features

✅ **RESTful API Design**
- Proper HTTP methods and status codes
- Resource-based URLs
- Consistent response format

✅ **Pagination & Sorting**
- Configurable page size (up to 100 items)
- Sort by any field (title, status, priority, dates)
- Ascending/descending sort order
- Pagination metadata (total pages, current page, etc.)

✅ **Input Validation**
- Comprehensive validation for all fields
- Detailed error messages
- Sanitization of input data

✅ **Error Handling**
- Global error handler
- Consistent error response format
- Proper HTTP status codes

✅ **In-Memory Data Storage**
- Fast performance
- Automatic ID generation
- Sample data included

✅ **CORS Support**
- Cross-origin requests enabled
- Preflight request handling

✅ **Security Features**
- Security headers
- Input sanitization
- Request size limits

## Testing the API

You can test the API using tools like:
- **Postman** - Import the endpoints above
- **curl** - Command line testing
- **VS Code REST Client** - Create `.http` files

Example with curl:
```bash
# Get all tasks
curl http://localhost:5000/api/tasks

# Create a new task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task with proper description length",
    "status": "todo",
    "priority": "medium",
    "dueDate": "2026-03-01T00:00:00.000Z"
  }'
```

### Production Build

```bash
npm run build
npm start
```

## Verify Setup

Once the server is running, verify the health endpoint:

```bash
curl http://localhost:3000/health
```

You should see:
```json
{"status": "ok"}
```

Or open in your browser: [http://localhost:3000/health](http://localhost:3000/health)

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point
│   ├── controllers/        # Request handlers
│   │   └── health.controller.ts
│   ├── routes/             # API routes
│   │   └── health.routes.ts
│   ├── middleware/         # Custom middleware
│   │   └── errorHandler.ts
│   └── models/             # Data models (empty - for your implementation)
├── .env                    # Environment variables
├── package.json
├── tsconfig.json           # TypeScript configuration
└── nodemon.json            # Nodemon configuration
```

## Environment Variables

The `.env` file contains:
```
PORT=3000
```

You can modify the port if needed.

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server (requires build first)

## For Backend-Only Candidates

You will implement the task management API in this backend. Focus on:
- Creating proper API endpoints in `routes/`
- Implementing controllers in `controllers/`
- Adding data models/interfaces in `models/`
- Implementing validation and error handling
- Using in-memory storage (no database required)

## For Full-Stack Candidates

This backend will serve as the API for your Angular frontend. Make sure to:
- Enable CORS if needed
- Test endpoints before integrating with frontend
- Follow RESTful conventions

Good luck! 🚀
