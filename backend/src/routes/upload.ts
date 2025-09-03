import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { CloudStorageService } from '../services/cloudStorage';
import { DocumentAIService } from '../services/documentAI';
import { FirestoreService } from '../services/firestore';
import { UploadResponse } from '../types';
import { CustomError } from '../types';

const router = Router();
const cloudStorageService = new CloudStorageService();
const documentAIService = new DocumentAIService();
const firestoreService = new FirestoreService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (documentAIService.isSupportedDocumentType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError('Unsupported file type', 400, 'UNSUPPORTED_FILE_TYPE'));
    }
  },
});

/**
 * POST /api/upload
 * Upload a document and extract text using Document AI
 */
router.post('/', 
  authenticateJWT, 
  upload.single('file'), 
  async (req: Request, res: Response) => {
    try {
      // Validate file upload
      if (!req.file) {
        throw new CustomError('No file uploaded', 400, 'NO_FILE');
      }

      const { studentId, subject, topic, subtopic } = req.body;

      if (!studentId) {
        throw new CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
      }

      // Validate file type
      if (!documentAIService.isSupportedDocumentType(req.file.mimetype)) {
        throw new CustomError(
          'Unsupported file type. Supported types: PDF, JPEG, PNG, GIF, WebP, TIFF, BMP',
          400,
          'UNSUPPORTED_FILE_TYPE'
        );
      }

      // Upload file to Cloud Storage
      const uploadResult = await cloudStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        studentId
      );

      // Extract text using Document AI
      let extractedText = '';

      try {
        extractedText = await documentAIService.extractText(
          req.file.buffer,
          req.file.mimetype
        );
        
        await documentAIService.getDocumentMetadata(
          req.file.buffer,
          req.file.mimetype
        );
      } catch (docAIError) {
        console.error('Document AI processing failed:', docAIError);
        
        // Continue with upload even if text extraction fails
        extractedText = 'Text extraction failed. Document uploaded successfully.';
      }

      // Save document information to Firestore
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
        embeddings: [], // Will be generated later if needed
      });

      // Update student progress
      await firestoreService.calculateProgress(studentId);

      // Prepare response
      const response: UploadResponse = {
        status: 'success',
        fileId: documentId,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in upload endpoint:', error);
      
      if (error instanceof CustomError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }
);

export default router;
