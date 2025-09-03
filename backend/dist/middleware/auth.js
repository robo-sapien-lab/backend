"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOwnership = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new types_1.CustomError('No authorization header or invalid format', 401, 'UNAUTHORIZED');
        }
        const token = authHeader.substring(7);
        if (!process.env.SUPABASE_JWT_SECRET) {
            throw new types_1.CustomError('JWT secret not configured', 500, 'CONFIGURATION_ERROR');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.SUPABASE_JWT_SECRET);
            if (decoded.exp < Date.now() / 1000) {
                throw new types_1.CustomError('Token expired', 401, 'TOKEN_EXPIRED');
            }
            req.user = {
                id: decoded.sub,
                ...(decoded.email ? { email: decoded.email } : {}),
                ...(decoded.role ? { role: decoded.role } : {})
            };
            next();
        }
        catch (jwtError) {
            throw new types_1.CustomError('Invalid JWT token', 401, 'INVALID_TOKEN');
        }
    }
    catch (error) {
        if (error instanceof types_1.CustomError) {
            res.status(error.statusCode).json({
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                error: 'Authentication failed',
                code: 'AUTH_ERROR'
            });
        }
    }
};
exports.authenticateJWT = authenticateJWT;
const validateOwnership = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
        });
        return;
    }
    const studentId = req.body.studentId || req.params.studentId || req.query.studentId;
    if (!studentId) {
        res.status(400).json({
            error: 'Student ID is required',
            code: 'MISSING_STUDENT_ID'
        });
        return;
    }
    if (req.user.id !== studentId) {
        res.status(403).json({
            error: 'Access denied: You can only access your own data',
            code: 'ACCESS_DENIED'
        });
        return;
    }
    next();
};
exports.validateOwnership = validateOwnership;
//# sourceMappingURL=auth.js.map