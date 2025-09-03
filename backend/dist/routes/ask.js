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
router.post('/', auth_1.authenticateJWT, auth_1.validateOwnership, async (req, res) => {
    try {
        const { question, studentId } = req.body;
        if (!question || !question.trim()) {
            throw new types_1.CustomError('Question is required', 400, 'MISSING_QUESTION');
        }
        if (!studentId) {
            throw new types_1.CustomError('Student ID is required', 400, 'MISSING_STUDENT_ID');
        }
        const documents = await firestoreService.getDocumentsByStudent(studentId);
        if (documents.length === 0) {
            throw new types_1.CustomError('No documents found. Please upload some materials first.', 400, 'NO_DOCUMENTS');
        }
        const context = documents
            .map(doc => doc.extractedText)
            .filter(text => text && text.trim().length > 0)
            .join('\n\n');
        if (!context.trim()) {
            throw new types_1.CustomError('No text content found in uploaded documents. Please upload documents with readable text.', 400, 'NO_TEXT_CONTENT');
        }
        const mostRecentDoc = documents[0];
        const subject = mostRecentDoc.subject;
        const topic = mostRecentDoc.topic;
        const subtopic = mostRecentDoc.subtopic;
        const aiResponse = await vertexAIService.generateAnswer(question.trim(), context, subject, topic, subtopic);
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
        await firestoreService.calculateProgress(studentId);
        const response = {
            answer: aiResponse.answer,
            sources: documents.slice(0, 3).map(doc => doc.fileName),
            ...(aiResponse.subject ? { subject: aiResponse.subject } : {}),
            ...(aiResponse.topic ? { topic: aiResponse.topic } : {}),
            ...(aiResponse.subtopic ? { subtopic: aiResponse.subtopic } : {})
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in ask endpoint:', error);
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
//# sourceMappingURL=ask.js.map