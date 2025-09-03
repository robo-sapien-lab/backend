"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexAIService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const googleCloud_1 = require("./googleCloud");
const types_1 = require("../types");
dotenv_1.default.config();
class VertexAIService {
    constructor() {
        this.model = (0, googleCloud_1.getVertexAiModel)();
    }
    async generateAnswer(question, context, subject, topic, subtopic) {
        try {
            const prompt = this.buildPrompt(question, context, subject, topic, subtopic);
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            const response = result.response;
            const answer = response.candidates[0].content.parts[0].text;
            if (!answer) {
                throw new types_1.CustomError('Failed to generate answer from Vertex AI', 500, 'AI_GENERATION_ERROR');
            }
            const extractedInfo = this.extractSubjectInfo(context, subject, topic, subtopic);
            return {
                answer: answer.trim(),
                ...extractedInfo
            };
        }
        catch (error) {
            console.error('Error generating answer with Vertex AI:', error);
            throw new types_1.CustomError('Failed to generate AI response', 500, 'AI_SERVICE_ERROR');
        }
    }
    async generateQuizQuestions(context, subject, topic, subtopic, questionCount = 5) {
        try {
            const prompt = this.buildQuizPrompt(context, subject, topic, subtopic, questionCount);
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            const response = result.response;
            const content = response.candidates[0].content.parts[0].text;
            return this.parseQuizQuestions(content);
        }
        catch (error) {
            console.error('Error generating quiz questions with Vertex AI:', error);
            throw new types_1.CustomError('Failed to generate quiz questions', 500, 'AI_SERVICE_ERROR');
        }
    }
    async generateEmbeddings(text) {
        try {
            const prompt = `Generate a numerical representation for this text: ${text}`;
            await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            return [];
        }
        catch (error) {
            console.error('Error generating embeddings:', error);
            return [];
        }
    }
    buildPrompt(question, context, subject, topic, subtopic) {
        let prompt = `You are an AI tutor helping a student with their studies. `;
        if (subject)
            prompt += `The subject is: ${subject}. `;
        if (topic)
            prompt += `The topic is: ${topic}. `;
        if (subtopic)
            prompt += `The subtopic is: ${subtopic}. `;
        prompt += `\n\nContext from the student's uploaded materials:\n${context}\n\n`;
        prompt += `Student's question: ${question}\n\n`;
        prompt += `Please provide a clear, educational answer based on the context provided. `;
        prompt += `If the context doesn't contain enough information to answer the question, `;
        prompt += `say so and suggest what additional information might be needed. `;
        prompt += `Keep your answer helpful, accurate, and appropriate for a student.`;
        return prompt;
    }
    buildQuizPrompt(context, subject, topic, subtopic, questionCount = 5) {
        let prompt = `Generate ${questionCount} multiple-choice quiz questions based on this educational content. `;
        if (subject)
            prompt += `Subject: ${subject}. `;
        if (topic)
            prompt += `Topic: ${topic}. `;
        if (subtopic)
            prompt += `Subtopic: ${subtopic}. `;
        prompt += `\n\nContent:\n${context}\n\n`;
        prompt += `For each question, provide:\n`;
        prompt += `1. A clear question\n`;
        prompt += `2. Four answer options (A, B, C, D)\n`;
        prompt += `3. The correct answer (0-3, where 0=A, 1=B, 2=C, 3=D)\n`;
        prompt += `4. A brief explanation of why the answer is correct\n\n`;
        prompt += `Format your response as a JSON array with this structure:\n`;
        prompt += `[{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "..."}]`;
        return prompt;
    }
    parseQuizQuestions(content) {
        try {
            const jsonMatch = content.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return this.generateFallbackQuestions();
        }
        catch (error) {
            console.error('Error parsing quiz questions:', error);
            return this.generateFallbackQuestions();
        }
    }
    generateFallbackQuestions() {
        return [
            {
                question: "What is the main topic discussed in the uploaded materials?",
                options: [
                    "A general overview",
                    "Specific technical details",
                    "Historical context",
                    "Future applications"
                ],
                correct_answer: 1,
                explanation: "The materials focus on specific technical details and concepts."
            }
        ];
    }
    extractSubjectInfo(context, subject, topic, subtopic) {
        const extractedSubject = subject || this.extractSubjectFromContext(context);
        const extractedTopic = topic || this.extractTopicFromContext(context);
        const extractedSubtopic = subtopic || this.extractSubtopicFromContext(context);
        return {
            ...(extractedSubject ? { subject: extractedSubject } : {}),
            ...(extractedTopic ? { topic: extractedTopic } : {}),
            ...(extractedSubtopic ? { subtopic: extractedSubtopic } : {})
        };
    }
    extractSubjectFromContext(context) {
        const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'literature'];
        const lowerContext = context.toLowerCase();
        for (const subject of subjects) {
            if (lowerContext.includes(subject)) {
                return subject.charAt(0).toUpperCase() + subject.slice(1);
            }
        }
        return undefined;
    }
    extractTopicFromContext(context) {
        const lines = context.split('\n').slice(0, 5);
        for (const line of lines) {
            if (line.length > 10 && line.length < 100) {
                return line.trim();
            }
        }
        return undefined;
    }
    extractSubtopicFromContext(context) {
        const words = context.split(' ').slice(0, 50);
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i].length > 3 && words[i + 1].length > 3) {
                return `${words[i]} ${words[i + 1]}`;
            }
        }
        return undefined;
    }
}
exports.VertexAIService = VertexAIService;
//# sourceMappingURL=vertexAI.js.map