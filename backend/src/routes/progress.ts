import { Router, Request, Response } from 'express';
import { authenticateJWT, validateOwnership } from '../middleware/auth';
import { FirestoreService } from '../services/firestore';
import { ProgressResponse } from '../types';
import { CustomError } from '../types';

const router = Router();
const firestoreService = new FirestoreService();

/**
 * GET /api/progress/:studentId
 * Get student progress and leaderboard data
 */
router.get('/:studentId', authenticateJWT, validateOwnership, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      throw new CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
    }

    // Get or calculate student progress
    let progress = await firestoreService.getProgress(studentId);
    
    if (!progress) {
      // Calculate progress if it doesn't exist
      progress = await firestoreService.calculateProgress(studentId);
    } else {
      // Recalculate progress to ensure it's up to date
      progress = await firestoreService.calculateProgress(studentId);
    }

    // Get leaderboard data
    const leaderboard = await firestoreService.getLeaderboard();

    // Prepare response
    const response: ProgressResponse = {
      progress: {
        totalQuestions: progress.totalQuestions,
        totalQuizzes: progress.totalQuizzes,
        averageScore: progress.averageScore,
        totalUploads: progress.totalUploads,
        weakTopics: progress.weakTopics,
        recentActivity: progress.recentActivity,
        progressBySubject: progress.progressBySubject,
      },
      leaderboard: leaderboard.slice(0, 50), // Return top 50 students
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in progress endpoint:', error);
    
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
