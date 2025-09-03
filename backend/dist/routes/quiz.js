"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const vertexAI_1 = require("../services/vertexAI");
const firestore_1 = require("../services/firestore");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const vertexAIService = new vertexAI_1.VertexAIService();
const firestoreService = new firestore_1.FirestoreService();
router.post('/start', auth_1.authenticateJWT, auth_1.validateOwnership, async (req, res) => {
    try {
        const { studentId, topic } = req.body;
        if (!studentId) {
            throw new types_1.CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
        }
        const documents = await firestoreService.getDocumentsByStudent(studentId);
        if (documents.length === 0) {
            throw new types_1.CustomError('No documents found. Please upload some materials first.', 400, 'NO_DOCUMENTS');
        }
        let relevantDocuments = documents;
        if (topic) {
            relevantDocuments = documents.filter(doc => doc.topic?.toLowerCase().includes(topic.toLowerCase()) ||
                doc.subject?.toLowerCase().includes(topic.toLowerCase()) ||
                doc.subtopic?.toLowerCase().includes(topic.toLowerCase()));
            if (relevantDocuments.length === 0) {
                relevantDocuments = documents;
            }
        }
        const context = relevantDocuments
            .map(doc => doc.extractedText)
            .filter(text => text && text.trim().length > 0)
            .join('\n\n');
        if (!context.trim()) {
            throw new types_1.CustomError('No text content found in uploaded documents. Please upload documents with readable text.', 400, 'NO_TEXT_CONTENT');
        }
        const mostRelevantDoc = relevantDocuments[0];
        const subject = mostRelevantDoc.subject;
        const docTopic = mostRelevantDoc.topic;
        const subtopic = mostRelevantDoc.subtopic;
        const questions = await vertexAIService.generateQuizQuestions(context, subject, docTopic, subtopic, 5);
        const quizId = await firestoreService.createQuiz({
            studentId,
            title: `Quiz on ${topic || docTopic || subject || 'Uploaded Materials'}`,
            questions,
            ...(subject ? { subject } : {}),
            ...(docTopic ? { topic: docTopic } : {}),
            ...(subtopic ? { subtopic } : {})
        });
        const response = {
            quizId,
            questions,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in quiz start endpoint:', error);
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
router.post('/submit', auth_1.authenticateJWT, auth_1.validateOwnership, async (req, res) => {
    try {
        const { quizId, studentId, answers } = req.body;
        if (!quizId) {
            throw new types_1.CustomError('Quiz ID is required', 400, 'MISSING_QUIZ_ID');
        }
        if (!studentId) {
            throw new types_1.CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
        }
        if (!answers || !Array.isArray(answers)) {
            throw new types_1.CustomError('Answers array is required', 400, 'MISSING_ANSWERS');
        }
        const quiz = await firestoreService.getQuiz(quizId);
        if (!quiz) {
            throw new types_1.CustomError('Quiz not found', 404, 'QUIZ_NOT_FOUND');
        }
        if (quiz.studentId !== studentId) {
            throw new types_1.CustomError('Access denied: Quiz does not belong to student', 403, 'ACCESS_DENIED');
        }
        if (answers.length !== quiz.questions.length) {
            throw new types_1.CustomError('Number of answers does not match number of questions', 400, 'INVALID_ANSWERS');
        }
        let score = 0;
        const correctAnswers = [];
        const explanations = [];
        for (let i = 0; i < quiz.questions.length; i++) {
            const question = quiz.questions[i];
            const studentAnswer = answers[i];
            if (studentAnswer === question.correct_answer) {
                score++;
                correctAnswers.push(true);
            }
            else {
                correctAnswers.push(false);
            }
            explanations.push(question.explanation);
        }
        const percentageScore = Math.round((score / quiz.questions.length) * 100);
        await firestoreService.createQuizAttempt({
            quizId,
            studentId,
            answers,
            score,
            totalQuestions: quiz.questions.length,
            correctAnswers,
            feedback: `You scored ${score} out of ${quiz.questions.length} (${percentageScore}%)`,
        });
        await firestoreService.calculateProgress(studentId);
        const user = await firestoreService.getUser(studentId);
        if (user) {
            const progress = await firestoreService.getProgress(studentId);
            if (progress) {
                await firestoreService.updateLeaderboard(studentId, user.name, progress.totalQuestions + progress.totalQuizzes, progress.totalQuestions, progress.averageScore);
            }
        }
        const response = {
            score: percentageScore,
            feedback: `You scored ${score} out of ${quiz.questions.length} (${percentageScore}%)`,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in quiz submit endpoint:', error);
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
//# sourceMappingURL=quiz.js.map