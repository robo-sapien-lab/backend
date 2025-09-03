import { firestore } from './googleCloud';
import { 
  UserDocument, 
  DocumentUpload, 
  Question, 
  Quiz, 
  QuizAttempt, 
  Progress, 
  LeaderboardEntry 
} from '../types';
import { CustomError } from '../types';

export class FirestoreService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = firestore;
  }

  // User operations
  async getUser(userId: string): Promise<UserDocument | null> {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? (doc.data() as UserDocument) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new CustomError('Failed to get user', 500, 'FIRESTORE_ERROR');
    }
  }

  async createUser(userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const userRef = this.db.collection('users').doc();
      
      const user: UserDocument = {
        id: userRef.id,
        ...userData,
        createdAt: now as any,
        updatedAt: now as any,
      };

      await userRef.set(user);
      return userRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new CustomError('Failed to create user', 500, 'FIRESTORE_ERROR');
    }
  }

  // Document upload operations
  async createDocumentUpload(uploadData: Omit<DocumentUpload, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const uploadRef = this.db.collection('documentUploads').doc();
      
      const upload: DocumentUpload = {
        id: uploadRef.id,
        ...uploadData,
        createdAt: now as any,
        updatedAt: now as any,
      };

      await uploadRef.set(upload);
      return uploadRef.id;
    } catch (error) {
      console.error('Error creating document upload:', error);
      throw new CustomError('Failed to create document upload', 500, 'FIRESTORE_ERROR');
    }
  }

  async getDocumentsByStudent(studentId: string): Promise<DocumentUpload[]> {
    try {
      const snapshot = await this.db
        .collection('documentUploads')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as DocumentUpload);
    } catch (error) {
      console.error('Error getting documents by student:', error);
      throw new CustomError('Failed to get documents', 500, 'FIRESTORE_ERROR');
    }
  }

  // Question operations
  async createQuestion(questionData: Omit<Question, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = new Date();
      const questionRef = this.db.collection('questions').doc();
      
      const question: Question = {
        id: questionRef.id,
        ...questionData,
        createdAt: now as any,
      };

      await questionRef.set(question);
      return questionRef.id;
    } catch (error) {
      console.error('Error creating question:', error);
      throw new CustomError('Failed to create question', 500, 'FIRESTORE_ERROR');
    }
  }

  async getQuestionsByStudent(studentId: string): Promise<Question[]> {
    try {
      const snapshot = await this.db
        .collection('questions')
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Question);
    } catch (error) {
      console.error('Error getting questions by student:', error);
      throw new CustomError('Failed to get questions', 500, 'FIRESTORE_ERROR');
    }
  }

  // Quiz operations
  async createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = new Date();
      const quizRef = this.db.collection('quizzes').doc();
      
      const quiz: Quiz = {
        id: quizRef.id,
        ...quizData,
        createdAt: now as any,
      };

      await quizRef.set(quiz);
      return quizRef.id;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw new CustomError('Failed to create quiz', 500, 'FIRESTORE_ERROR');
    }
  }

  async getQuiz(quizId: string): Promise<Quiz | null> {
    try {
      const doc = await this.db.collection('quizzes').doc(quizId).get();
      return doc.exists ? (doc.data() as Quiz) : null;
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw new CustomError('Failed to get quiz', 500, 'FIRESTORE_ERROR');
    }
  }

  async createQuizAttempt(attemptData: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<string> {
    try {
      const now = new Date();
      const attemptRef = this.db.collection('quizAttempts').doc();
      
      const attempt: QuizAttempt = {
        id: attemptRef.id,
        ...attemptData,
        completedAt: now as any,
      };

      await attemptRef.set(attempt);
      return attemptRef.id;
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      throw new CustomError('Failed to create quiz attempt', 500, 'FIRESTORE_ERROR');
    }
  }

  // Progress operations
  async getProgress(studentId: string): Promise<Progress | null> {
    try {
      const doc = await this.db.collection('progress').doc(studentId).get();
      return doc.exists ? (doc.data() as Progress) : null;
    } catch (error) {
      console.error('Error getting progress:', error);
      throw new CustomError('Failed to get progress', 500, 'FIRESTORE_ERROR');
    }
  }

  async updateProgress(studentId: string, progressData: Partial<Progress>): Promise<void> {
    try {
      const now = new Date();
      await this.db.collection('progress').doc(studentId).set({
        ...progressData,
        studentId,
        updatedAt: now as any,
      }, { merge: true });
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new CustomError('Failed to update progress', 500, 'FIRESTORE_ERROR');
    }
  }

  async calculateProgress(studentId: string): Promise<Progress> {
    try {
      // Get all questions for the student
      const questions = await this.getQuestionsByStudent(studentId);
      
      // Get all quiz attempts for the student
      const quizAttemptsSnapshot = await this.db
        .collection('quizAttempts')
        .where('studentId', '==', studentId)
        .get();
      
      const quizAttempts = quizAttemptsSnapshot.docs.map(doc => doc.data() as QuizAttempt);
      
      // Get all documents for the student
      const documents = await this.getDocumentsByStudent(studentId);
      
      // Calculate progress metrics
      const totalQuestions = questions.length;
      const totalQuizzes = quizAttempts.length;
      const averageScore = quizAttempts.length > 0 
        ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalQuestions), 0) / quizAttempts.length * 100
        : 0;
      const totalUploads = documents.length;
      
      // Calculate weak topics based on quiz performance
      const weakTopics = await this.calculateWeakTopics(quizAttempts);
      
      // Calculate recent activity
      const recentActivity = this.calculateRecentActivity(questions, quizAttempts);
      
      // Calculate progress by subject
      const progressBySubject = await this.calculateProgressBySubject(quizAttempts);
      
      const progress: Progress = {
        studentId,
        totalQuestions,
        totalQuizzes,
        averageScore,
        totalUploads,
        weakTopics,
        recentActivity,
        progressBySubject,
        updatedAt: new Date() as any,
      };
      
      // Save the calculated progress
      await this.updateProgress(studentId, progress);
      
      return progress;
    } catch (error) {
      console.error('Error calculating progress:', error);
      throw new CustomError('Failed to calculate progress', 500, 'FIRESTORE_ERROR');
    }
  }

  private async calculateWeakTopics(
    quizAttempts: QuizAttempt[]
  ): Promise<Array<{ subject: string; topic: string; subtopic?: string; mastery_score: number }>> {
    const topicScores = new Map<string, { total: number; correct: number; count: number }>();
    
    // Aggregate scores by topic
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
    
    // Convert to weak topics array
    const weakTopics: Array<{ subject: string; topic: string; subtopic?: string; mastery_score: number }> = [];
    
    for (const [key, scores] of topicScores) {
      if (scores.count >= 2) { // Only include topics with at least 2 attempts
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
    
    // Sort by mastery score (lowest first) and return top 5
    return weakTopics
      .sort((a, b) => a.mastery_score - b.mastery_score)
      .slice(0, 5);
  }

  private calculateRecentActivity(
    questions: Question[],
    quizAttempts: QuizAttempt[]
  ): Array<{ type: 'question' | 'quiz'; title: string; score?: number; timestamp: string }> {
    const activities: Array<{ type: 'question' | 'quiz'; title: string; score?: number; timestamp: string }> = [];
    
    // Add recent questions
    for (const question of questions.slice(0, 5)) {
      activities.push({
        type: 'question',
        title: question.questionText.substring(0, 50) + '...',
        timestamp: (question.createdAt as any).toDate().toISOString(),
      });
    }
    
    // Add recent quiz attempts
    for (const attempt of quizAttempts.slice(0, 5)) {
      activities.push({
        type: 'quiz',
        title: `Quiz completed`,
        score: Math.round((attempt.score / attempt.totalQuestions) * 100),
        timestamp: (attempt.completedAt as any).toDate().toISOString(),
      });
    }
    
    // Sort by timestamp (newest first) and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  private async calculateProgressBySubject(
    quizAttempts: QuizAttempt[]
  ): Promise<Array<{ subject: string; topics: Array<{ topic: string; mastery_score: number; questions_attempted: number }> }>> {
    const subjectProgress = new Map<string, Map<string, { total: number; correct: number; questions: 0 }>>();
    
    // Aggregate by subject and topic
    for (const attempt of quizAttempts) {
      const quiz = await this.getQuiz(attempt.quizId);
      if (quiz && quiz.subject && quiz.topic) {
        if (!subjectProgress.has(quiz.subject)) {
          subjectProgress.set(quiz.subject, new Map());
        }
        
        const topicMap = subjectProgress.get(quiz.subject)!;
        if (!topicMap.has(quiz.topic)) {
          topicMap.set(quiz.topic, { total: 0, correct: 0, questions: 0 });
        }
        
        const topic = topicMap.get(quiz.topic)!;
        topic.total += attempt.totalQuestions;
        topic.correct += attempt.correctAnswers.filter(Boolean).length;
        topic.questions += 1;
      }
    }
    
    // Convert to progress array
    const progressBySubject: Array<{ subject: string; topics: Array<{ topic: string; mastery_score: number; questions_attempted: number }> }> = [];
    
    for (const [subject, topics] of subjectProgress) {
      const topicArray: Array<{ topic: string; mastery_score: number; questions_attempted: number }> = [];
      
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
    
    return progressBySubject.sort((a, b) => 
      b.topics.reduce((sum, t) => sum + t.mastery_score, 0) / b.topics.length -
      a.topics.reduce((sum, t) => sum + t.mastery_score, 0) / a.topics.length
    );
  }

  // Leaderboard operations
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const snapshot = await this.db
        .collection('leaderboard')
        .orderBy('score', 'desc')
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();

      return snapshot.docs.map((doc, index) => ({
        ...doc.data() as LeaderboardEntry,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw new CustomError('Failed to get leaderboard', 500, 'FIRESTORE_ERROR');
    }
  }

  async updateLeaderboard(studentId: string, studentName: string, score: number, totalQuestions: number, averageScore: number): Promise<void> {
    try {
      const now = new Date();
      await this.db.collection('leaderboard').doc(studentId).set({
        studentId,
        studentName,
        score,
        totalQuestions,
        averageScore,
        updatedAt: now as any,
      });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw new CustomError('Failed to update leaderboard', 500, 'FIRESTORE_ERROR');
    }
  }
}
