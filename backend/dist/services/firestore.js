"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreService = void 0;
const googleCloud_1 = require("./googleCloud");
const types_1 = require("../types");
class FirestoreService {
    constructor() {
        this.db = googleCloud_1.firestore;
    }
    async getUser(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        }
        catch (error) {
            console.error('Error getting user:', error);
            throw new types_1.CustomError('Failed to get user', 500, 'FIRESTORE_ERROR');
        }
    }
    async createUser(userData) {
        try {
            const now = new Date();
            const userRef = this.db.collection('users').doc();
            const user = {
                id: userRef.id,
                ...userData,
                createdAt: now,
                updatedAt: now,
            };
            await userRef.set(user);
            return userRef.id;
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw new types_1.CustomError('Failed to create user', 500, 'FIRESTORE_ERROR');
        }
    }
    async createDocumentUpload(uploadData) {
        try {
            const now = new Date();
            const uploadRef = this.db.collection('documentUploads').doc();
            const upload = {
                id: uploadRef.id,
                ...uploadData,
                createdAt: now,
                updatedAt: now,
            };
            await uploadRef.set(upload);
            return uploadRef.id;
        }
        catch (error) {
            console.error('Error creating document upload:', error);
            throw new types_1.CustomError('Failed to create document upload', 500, 'FIRESTORE_ERROR');
        }
    }
    async getDocumentsByStudent(studentId) {
        try {
            const snapshot = await this.db
                .collection('documentUploads')
                .where('studentId', '==', studentId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Error getting documents by student:', error);
            throw new types_1.CustomError('Failed to get documents', 500, 'FIRESTORE_ERROR');
        }
    }
    async createQuestion(questionData) {
        try {
            const now = new Date();
            const questionRef = this.db.collection('questions').doc();
            const question = {
                id: questionRef.id,
                ...questionData,
                createdAt: now,
            };
            await questionRef.set(question);
            return questionRef.id;
        }
        catch (error) {
            console.error('Error creating question:', error);
            throw new types_1.CustomError('Failed to create question', 500, 'FIRESTORE_ERROR');
        }
    }
    async getQuestionsByStudent(studentId) {
        try {
            const snapshot = await this.db
                .collection('questions')
                .where('studentId', '==', studentId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Error getting questions by student:', error);
            throw new types_1.CustomError('Failed to get questions', 500, 'FIRESTORE_ERROR');
        }
    }
    async createQuiz(quizData) {
        try {
            const now = new Date();
            const quizRef = this.db.collection('quizzes').doc();
            const quiz = {
                id: quizRef.id,
                ...quizData,
                createdAt: now,
            };
            await quizRef.set(quiz);
            return quizRef.id;
        }
        catch (error) {
            console.error('Error creating quiz:', error);
            throw new types_1.CustomError('Failed to create quiz', 500, 'FIRESTORE_ERROR');
        }
    }
    async getQuiz(quizId) {
        try {
            const doc = await this.db.collection('quizzes').doc(quizId).get();
            return doc.exists ? doc.data() : null;
        }
        catch (error) {
            console.error('Error getting quiz:', error);
            throw new types_1.CustomError('Failed to get quiz', 500, 'FIRESTORE_ERROR');
        }
    }
    async createQuizAttempt(attemptData) {
        try {
            const now = new Date();
            const attemptRef = this.db.collection('quizAttempts').doc();
            const attempt = {
                id: attemptRef.id,
                ...attemptData,
                completedAt: now,
            };
            await attemptRef.set(attempt);
            return attemptRef.id;
        }
        catch (error) {
            console.error('Error creating quiz attempt:', error);
            throw new types_1.CustomError('Failed to create quiz attempt', 500, 'FIRESTORE_ERROR');
        }
    }
    async getProgress(studentId) {
        try {
            const doc = await this.db.collection('progress').doc(studentId).get();
            return doc.exists ? doc.data() : null;
        }
        catch (error) {
            console.error('Error getting progress:', error);
            throw new types_1.CustomError('Failed to get progress', 500, 'FIRESTORE_ERROR');
        }
    }
    async updateProgress(studentId, progressData) {
        try {
            const now = new Date();
            await this.db.collection('progress').doc(studentId).set({
                ...progressData,
                studentId,
                updatedAt: now,
            }, { merge: true });
        }
        catch (error) {
            console.error('Error updating progress:', error);
            throw new types_1.CustomError('Failed to update progress', 500, 'FIRESTORE_ERROR');
        }
    }
    async calculateProgress(studentId) {
        try {
            const questions = await this.getQuestionsByStudent(studentId);
            const quizAttemptsSnapshot = await this.db
                .collection('quizAttempts')
                .where('studentId', '==', studentId)
                .get();
            const quizAttempts = quizAttemptsSnapshot.docs.map(doc => doc.data());
            const documents = await this.getDocumentsByStudent(studentId);
            const totalQuestions = questions.length;
            const totalQuizzes = quizAttempts.length;
            const averageScore = quizAttempts.length > 0
                ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalQuestions), 0) / quizAttempts.length * 100
                : 0;
            const totalUploads = documents.length;
            const weakTopics = await this.calculateWeakTopics(quizAttempts);
            const recentActivity = this.calculateRecentActivity(questions, quizAttempts);
            const progressBySubject = await this.calculateProgressBySubject(quizAttempts);
            const progress = {
                studentId,
                totalQuestions,
                totalQuizzes,
                averageScore,
                totalUploads,
                weakTopics,
                recentActivity,
                progressBySubject,
                updatedAt: new Date(),
            };
            await this.updateProgress(studentId, progress);
            return progress;
        }
        catch (error) {
            console.error('Error calculating progress:', error);
            throw new types_1.CustomError('Failed to calculate progress', 500, 'FIRESTORE_ERROR');
        }
    }
    async calculateWeakTopics(quizAttempts) {
        const topicScores = new Map();
        for (const attempt of quizAttempts) {
            const quiz = await this.getQuiz(attempt.quizId);
            if (quiz && quiz.topic) {
                const key = `${quiz.subject || 'Unknown'}-${quiz.topic}-${quiz.subtopic || ''}`;
                const current = topicScores.get(key) || { total: 0, correct: 0, count: 0 };
                current.total += attempt.score;
                current.correct += attempt.correctAnswers.filter(Boolean).length;
                current.count += 1;
                topicScores.set(key, current);
            }
        }
        const weakTopics = [];
        for (const [key, scores] of topicScores) {
            if (scores.count >= 2) {
                const [subject, topic, subtopic] = key.split('-');
                const mastery_score = Math.round((scores.correct / scores.total) * 100);
                weakTopics.push({
                    subject: subject || 'Unknown',
                    topic: topic || 'Unknown',
                    subtopic: subtopic,
                    mastery_score
                });
            }
        }
        return weakTopics
            .sort((a, b) => a.mastery_score - b.mastery_score)
            .slice(0, 5);
    }
    calculateRecentActivity(questions, quizAttempts) {
        const activities = [];
        for (const question of questions.slice(0, 5)) {
            activities.push({
                type: 'question',
                title: question.questionText.substring(0, 50) + '...',
                timestamp: question.createdAt.toDate().toISOString(),
            });
        }
        for (const attempt of quizAttempts.slice(0, 5)) {
            activities.push({
                type: 'quiz',
                title: `Quiz completed`,
                score: Math.round((attempt.score / attempt.totalQuestions) * 100),
                timestamp: attempt.completedAt.toDate().toISOString(),
            });
        }
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }
    async calculateProgressBySubject(quizAttempts) {
        const subjectProgress = new Map();
        for (const attempt of quizAttempts) {
            const quiz = await this.getQuiz(attempt.quizId);
            if (quiz && quiz.subject && quiz.topic) {
                if (!subjectProgress.has(quiz.subject)) {
                    subjectProgress.set(quiz.subject, new Map());
                }
                const topicMap = subjectProgress.get(quiz.subject);
                if (!topicMap.has(quiz.topic)) {
                    topicMap.set(quiz.topic, { total: 0, correct: 0, questions: 0 });
                }
                const topic = topicMap.get(quiz.topic);
                topic.total += attempt.totalQuestions;
                topic.correct += attempt.correctAnswers.filter(Boolean).length;
                topic.questions += 1;
            }
        }
        const progressBySubject = [];
        for (const [subject, topics] of subjectProgress) {
            const topicArray = [];
            for (const [topicName, scores] of topics) {
                topicArray.push({
                    topic: topicName,
                    mastery_score: Math.round((scores.correct / scores.total) * 100),
                    questions_attempted: scores.questions
                });
            }
            progressBySubject.push({
                subject,
                topics: topicArray.sort((a, b) => b.mastery_score - a.mastery_score)
            });
        }
        return progressBySubject.sort((a, b) => b.topics.reduce((sum, t) => sum + t.mastery_score, 0) / b.topics.length -
            a.topics.reduce((sum, t) => sum + t.mastery_score, 0) / a.topics.length);
    }
    async getLeaderboard() {
        try {
            const snapshot = await this.db
                .collection('leaderboard')
                .orderBy('score', 'desc')
                .orderBy('updatedAt', 'desc')
                .limit(100)
                .get();
            return snapshot.docs.map((doc, index) => ({
                ...doc.data(),
                rank: index + 1
            }));
        }
        catch (error) {
            console.error('Error getting leaderboard:', error);
            throw new types_1.CustomError('Failed to get leaderboard', 500, 'FIRESTORE_ERROR');
        }
    }
    async updateLeaderboard(studentId, studentName, score, totalQuestions, averageScore) {
        try {
            const now = new Date();
            await this.db.collection('leaderboard').doc(studentId).set({
                studentId,
                studentName,
                score,
                totalQuestions,
                averageScore,
                updatedAt: now,
            });
        }
        catch (error) {
            console.error('Error updating leaderboard:', error);
            throw new types_1.CustomError('Failed to update leaderboard', 500, 'FIRESTORE_ERROR');
        }
    }
}
exports.FirestoreService = FirestoreService;
//# sourceMappingURL=firestore.js.map