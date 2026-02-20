import express, { Application, Request, Response } from 'express';
import healthRoutes from './routes/health.routes';
import taskRoutes from './routes/task.routes';
import { errorHandler } from './middleware/errorHandler';
import { corsMiddleware, securityHeaders } from './middleware/cors';

const app: Application = express();

// Security and CORS middleware (must be first)
app.use(securityHeaders);
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.use('/', healthRoutes);

// API Routes
app.use('/api/tasks', taskRoutes);

// Root endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Task Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tasks: '/api/tasks',
      docs: 'See README.md for API documentation'
    }
  });
});

// 404 handler for unknown routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
