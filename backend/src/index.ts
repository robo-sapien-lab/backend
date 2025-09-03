import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

// Convert PORT to number
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📚 Avyra EDAI Backend API`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  
  if (NODE_ENV === 'development') {
    console.log(`📖 API Documentation: http://0.0.0.0:${PORT}/api/*`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});
