"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const server = app_1.default.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`📚 Avyra EDAI Backend API`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    if (NODE_ENV === 'development') {
        console.log(`📖 API Documentation: http://0.0.0.0:${PORT}/api/*`);
    }
});
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
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});
//# sourceMappingURL=index.js.map