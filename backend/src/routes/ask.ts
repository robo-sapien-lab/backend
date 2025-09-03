import { Router, Request, Response } from 'express';
import { authenticateJWT, validateOwnership } from '../middleware/auth';
import { VertexAIService } from '../services/vertexAI';
import { FirestoreService } from '../services/firestore';
import { AskQuestionRequest, AskQuestionResponse } from '../types';
import { CustomError } from '../types';

const router = Router();
const vertexAIService = new VertexAIService();
const firestoreService = new FirestoreService();

/**
 * POST /api/ask
 * Ask a question and get AI-powered response using Vertex AI
 */
router.post('/', authenticateJWT, validateOwnership, async (req: Request, res: Response) => {
  try {
    const { question, studentId }: AskQuestionRequest = req.body;

    // Validate request
    if (!question || !question.trim()) {
      throw new CustomError('Question is required', 400, 'MISSING_QUESTION');
    }

    if (!studentId) {
      throw new CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
    }

    // Get student's uploaded documents for context
    const documents = await firestoreService.getDocumentsByStudent(studentId);
    
    if (documents.length === 0) {
      throw new CustomError(
        'No documents found. Please upload some materials first.',
        400,
        'NO_DOCUMENTS'
      );
    }

    // Build context from uploaded documents
    const context = documents
      .map(doc => doc.extractedText)
      .filter(text => text && text.trim().length > 0)
      .join('\n\n');

    if (!context.trim()) {
      throw new CustomError(
        'No text content found in uploaded documents. Please upload documents with readable text.',
        400,
        'NO_TEXT_CONTENT'
      );
    }

    // Get subject/topic information from the most recent document
    const mostRecentDoc = documents[0];
    const subject = mostRecentDoc.subject;
    const topic = mostRecentDoc.topic;
    const subtopic = mostRecentDoc.subtopic;

    // Generate answer using Vertex AI
    const aiResponse = await vertexAIService.generateAnswer(
      question.trim(),
      context,
      subject,
      topic,
      subtopic
    );

    // Save the question and answer to Firestore
    await firestoreService.createQuestion({
      studentId,
      questionText: question.trim(),
      answerText: aiResponse.answer,
      ...(aiResponse.subject ? { subject: aiResponse.subject } : {}),
      ...(aiResponse.topic ? { topic: aiResponse.topic } : {}),
      ...(aiResponse.subtopic ? { subtopic: aiResponse.subtopic } : {}),
      sourceChunks: documents.slice(0, 3).map(doc => ({
        content: doc.extractedText.substring(0, 200) + '...',
        uploadId: doc.id,
        ...(doc.subject ? { subject: doc.subject } : {}),
        ...(doc.topic ? { topic: doc.topic } : {}),
        ...(doc.subtopic ? { subtopic: doc.subtopic } : {})
      }))
    });

    // Update student progress
    await firestoreService.calculateProgress(studentId);

    // Prepare response
    const response: AskQuestionResponse = {
      answer: aiResponse.answer,
      sources: documents.slice(0, 3).map(doc => doc.fileName),
      ...(aiResponse.subject ? { subject: aiResponse.subject } : {}),
      ...(aiResponse.topic ? { topic: aiResponse.topic } : {}),
      ...(aiResponse.subtopic ? { subtopic: aiResponse.subtopic } : {})
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in ask endpoint:', error);
    
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
});

export default router;
