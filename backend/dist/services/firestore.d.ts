import { UserDocument, DocumentUpload, Question, Quiz, QuizAttempt, Progress, LeaderboardEntry } from '../types';
export declare class FirestoreService {
    private db;
    constructor();
    getUser(userId: string): Promise<UserDocument | null>;
    createUser(userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    createDocumentUpload(uploadData: Omit<DocumentUpload, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    getDocumentsByStudent(studentId: string): Promise<DocumentUpload[]>;
    createQuestion(questionData: Omit<Question, 'id' | 'createdAt'>): Promise<string>;
    getQuestionsByStudent(studentId: string): Promise<Question[]>;
    createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt'>): Promise<string>;
    getQuiz(quizId: string): Promise<Quiz | null>;
    createQuizAttempt(attemptData: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<string>;
    getProgress(studentId: string): Promise<Progress | null>;
    updateProgress(studentId: string, progressData: Partial<Progress>): Promise<void>;
    calculateProgress(studentId: string): Promise<Progress>;
    private calculateWeakTopics;
    private calculateRecentActivity;
    private calculateProgressBySubject;
    getLeaderboard(): Promise<LeaderboardEntry[]>;
    updateLeaderboard(studentId: string, studentName: string, score: number, totalQuestions: number, averageScore: number): Promise<void>;
}
//# sourceMappingURL=firestore.d.ts.map