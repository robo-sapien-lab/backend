import { Router, Request, Response } from 'express';
import { authenticateJWT, validateOwnership } from '../middleware/auth';
import { VertexAIService } from '../services/vertexAI';
import { FirestoreService } from '../services/firestore';
import { QuizStartRequest, QuizStartResponse, QuizSubmitRequest, QuizSubmitResponse } from '../types';
import { CustomError } from '../types';

const router = Router();
const vertexAIService = new VertexAIService();
const firestoreService = new FirestoreService();

/**
 * POST /api/quiz/start
 * Start a new quiz with AI-generated questions
 */
router.post('/start', authenticateJWT, validateOwnership, async (req: Request, res: Response) => {
  try {
    const { studentId, topic }: QuizStartRequest = req.body;

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

    // Filter documents by topic if specified
    let relevantDocuments = documents;
    if (topic) {
      relevantDocuments = documents.filter(doc => 
        doc.topic?.toLowerCase().includes(topic.toLowerCase()) ||
        doc.subject?.toLowerCase().includes(topic.toLowerCase()) ||
        doc.subtopic?.toLowerCase().includes(topic.toLowerCase())
      );
      
      // If no documents match the topic, use all documents
      if (relevantDocuments.length === 0) {
        relevantDocuments = documents;
      }
    }

    // Build context from relevant documents
    const context = relevantDocuments
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

    // Get subject/topic information from the most relevant document
    const mostRelevantDoc = relevantDocuments[0];
    const subject = mostRelevantDoc.subject;
    const docTopic = mostRelevantDoc.topic;
    const subtopic = mostRelevantDoc.subtopic;

    // Generate quiz questions using Vertex AI
    const questions = await vertexAIService.generateQuizQuestions(
      context,
      subject,
      docTopic,
      subtopic,
      5 // Generate 5 questions
    );

    // Create quiz in Firestore
    const quizId = await firestoreService.createQuiz({
      studentId,
      title: `Quiz on ${topic || docTopic || subject || 'Uploaded Materials'}`,
      questions,
      ...(subject ? { subject } : {}),
      ...(docTopic ? { topic: docTopic } : {}),
      ...(subtopic ? { subtopic } : {})
    });

    // Prepare response
    const response: QuizStartResponse = {
      quizId,
      questions,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in quiz start endpoint:', error);
    
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

/**
 * POST /api/quiz/submit
 * Submit quiz answers and get results
 */
router.post('/submit', authenticateJWT, validateOwnership, async (req: Request, res: Response) => {
  try {
    const { quizId, studentId, answers }: QuizSubmitRequest = req.body;

    if (!quizId) {
      throw new CustomError('Quiz ID is required', 400, 'MISSING_QUIZ_ID');
    }

    if (!studentId) {
      throw new CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
    }

    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Answers array is required', 400, 'MISSING_ANSWERS');
    }

    // Get the quiz
    const quiz = await firestoreService.getQuiz(quizId);
    
    if (!quiz) {
      throw new CustomError('Quiz not found', 404, 'QUIZ_NOT_FOUND');
    }

    // Validate that the quiz belongs to the student
    if (quiz.studentId !== studentId) {
      throw new CustomError('Access denied: Quiz does not belong to student', 403, 'ACCESS_DENIED');
    }

    // Validate answers array length
    if (answers.length !== quiz.questions.length) {
      throw new CustomError('Number of answers does not match number of questions', 400, 'INVALID_ANSWERS');
    }

    // Grade the quiz
    let score = 0;
    const correctAnswers: boolean[] = [];
    const explanations: string[] = [];

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      const studentAnswer = answers[i];
      
      if (studentAnswer === question.correct_answer) {
        score++;
        correctAnswers.push(true);
      } else {
        correctAnswers.push(false);
      }
      
      explanations.push(question.explanation);
    }

    // Calculate percentage score
    const percentageScore = Math.round((score / quiz.questions.length) * 100);

    // Create quiz attempt record
    await firestoreService.createQuizAttempt({
      quizId,
      studentId,
      answers,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      feedback: `You scored ${score} out of ${quiz.questions.length} (${percentageScore}%)`,
    });

    // Update student progress
    await firestoreService.calculateProgress(studentId);

    // Update leaderboard
    const user = await firestoreService.getUser(studentId);
    if (user) {
      const progress = await firestoreService.getProgress(studentId);
      if (progress) {
        await firestoreService.updateLeaderboard(
          studentId,
          user.name,
          progress.totalQuestions + progress.totalQuizzes,
          progress.totalQuestions,
          progress.averageScore
        );
      }
    }

    // Prepare response
    const response: QuizSubmitResponse = {
      score: percentageScore,
      feedback: `You scored ${score} out of ${quiz.questions.length} (${percentageScore}%)`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in quiz submit endpoint:', error);
    
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
