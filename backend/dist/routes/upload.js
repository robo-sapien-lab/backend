"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const cloudStorage_1 = require("../services/cloudStorage");
const documentAI_1 = require("../services/documentAI");
const firestore_1 = require("../services/firestore");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const cloudStorageService = new cloudStorage_1.CloudStorageService();
const documentAIService = new documentAI_1.DocumentAIService();
const firestoreService = new firestore_1.FirestoreService();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (documentAIService.isSupportedDocumentType(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new types_1.CustomError('Unsupported file type', 400, 'UNSUPPORTED_FILE_TYPE'));
        }
    },
});
router.post('/', auth_1.authenticateJWT, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            throw new types_1.CustomError('No file uploaded', 400, 'NO_FILE');
        }
        const { studentId, subject, topic, subtopic } = req.body;
        if (!studentId) {
            throw new types_1.CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
        }
        if (!documentAIService.isSupportedDocumentType(req.file.mimetype)) {
            throw new types_1.CustomError('Unsupported file type. Supported types: PDF, JPEG, PNG, GIF, WebP, TIFF, BMP', 400, 'UNSUPPORTED_FILE_TYPE');
        }
        const uploadResult = await cloudStorageService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, studentId);
        let extractedText = '';
        try {
            extractedText = await documentAIService.extractText(req.file.buffer, req.file.mimetype);
            await documentAIService.getDocumentMetadata(req.file.buffer, req.file.mimetype);
        }
        catch (docAIError) {
            console.error('Document AI processing failed:', docAIError);
            extractedText = 'Text extraction failed. Document uploaded successfully.';
        }
        const documentId = await firestoreService.createDocumentUpload({
            studentId,
            fileName: req.file.originalname,
            fileUrl: uploadResult.fileUrl,
            fileSize: uploadResult.fileSize,
            mimeType: req.file.mimetype,
            subject: subject || undefined,
            topic: topic || undefined,
            subtopic: subtopic || undefined,
            extractedText: extractedText,
            embeddings: [],
        });
        await firestoreService.calculateProgress(studentId);
        const response = {
            status: 'success',
            fileId: documentId,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in upload endpoint:', error);
        if (error instanceof types_1.CustomError) {
            res.status(error.statusCode).json({
                error: error.message,
                code: error.code
            });
        }
        else {
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR'
            });
        }
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map