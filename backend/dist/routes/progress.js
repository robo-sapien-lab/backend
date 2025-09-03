"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const firestore_1 = require("../services/firestore");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const firestoreService = new firestore_1.FirestoreService();
router.get('/:studentId', auth_1.authenticateJWT, auth_1.validateOwnership, async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!studentId) {
            throw new types_1.CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
        }
        let progress = await firestoreService.getProgress(studentId);
        if (!progress) {
            progress = await firestoreService.calculateProgress(studentId);
        }
        else {
            progress = await firestoreService.calculateProgress(studentId);
        }
        const leaderboard = await firestoreService.getLeaderboard();
        const response = {
            progress: {
                totalQuestions: progress.totalQuestions,
                totalQuizzes: progress.totalQuizzes,
                averageScore: progress.averageScore,
                totalUploads: progress.totalUploads,
                weakTopics: progress.weakTopics,
                recentActivity: progress.recentActivity,
                progressBySubject: progress.progressBySubject,
            },
            leaderboard: leaderboard.slice(0, 50),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in progress endpoint:', error);
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
//# sourceMappingURL=progress.js.map