"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const ask_1 = __importDefault(require("./routes/ask"));
const upload_1 = __importDefault(require("./routes/upload"));
const progress_1 = __importDefault(require("./routes/progress"));
const quiz_1 = __importDefault(require("./routes/quiz"));
const googleCloud_1 = require("./services/googleCloud");
dotenv_1.default.config();
(0, googleCloud_1.validateEnvironment)();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://avyra-edai.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((_req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${_req.method} ${_req.path} - ${_req.ip}`);
    next();
});
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.get('/api', (_req, res) => {
    res.json({
        message: 'Avyra API',
        availableEndpoints: ['/api/ask', '/api/upload', '/api/progress', '/api/quiz']
    });
});
app.use('/api/ask', ask_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/progress', progress_1.default);
app.use('/api/quiz', quiz_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl
    });
});
app.use((error, _req, res, _next) => {
    console.error('Global error handler:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.',
            code: 'FILE_TOO_LARGE'
        });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Unexpected file field.',
            code: 'UNEXPECTED_FILE'
        });
    }
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code || 'CUSTOM_ERROR'
        });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.message
        });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }
    return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map