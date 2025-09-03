// Core types for the API contract
export interface AskQuestionRequest {
  question: string;
  studentId: string;
}

export interface AskQuestionResponse {
  answer: string;
  sources?: string[];
  subject?: string;
  topic?: string;
  subtopic?: string;
}

export interface UploadRequest {
  file: Express.Multer.File;
  studentId: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
}

export interface UploadResponse {
  status: string;
  fileId: string;
}

export interface ProgressResponse {
  progress: {
    totalQuestions: number;
    totalQuizzes: number;
    averageScore: number;
    totalUploads: number;
    weakTopics: Array<{
      subject: string;
      topic: string;
      subtopic?: string;
      mastery_score: number;
    }>;
    recentActivity: Array<{
      type: 'question' | 'quiz';
      title: string;
      score?: number;
      timestamp: string;
    }>;
    progressBySubject: Array<{
      subject: string;
      topics: Array<{
        topic: string;
        mastery_score: number;
        questions_attempted: number;
      }>;
    }>;
  };
  leaderboard: Array<{
    rank: number;
    studentId: string;
    studentName: string;
    score: number;
    totalQuestions: number;
    averageScore: number;
  }>;
}

export interface QuizStartRequest {
  studentId: string;
  topic?: string;
}

export interface QuizStartResponse {
  quizId: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>;
}

export interface QuizSubmitRequest {
  quizId: string;
  studentId: string;
  answers: number[];
}

export interface QuizSubmitResponse {
  score: number;
  feedback?: string;
}

// Firestore document types
export interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  grade?: number;
  school?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface DocumentUpload {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  extractedText: string;
  embeddings?: number[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Question {
  id: string;
  studentId: string;
  questionText: string;
  answerText: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  sourceChunks?: Array<{
    content: string;
    uploadId: string;
    subject?: string;
    topic?: string;
    subtopic?: string;
  }>;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Quiz {
  id: string;
  studentId: string;
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>;
  subject?: string;
  topic?: string;
  subtopic?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  correctAnswers: boolean[];
  feedback?: string;
  completedAt: FirebaseFirestore.Timestamp;
}

export interface Progress {
  studentId: string;
  totalQuestions: number;
  totalQuizzes: number;
  averageScore: number;
  totalUploads: number;
  weakTopics: Array<{
    subject: string;
    topic: string;
    subtopic?: string;
    mastery_score: number;
  }>;
  recentActivity: Array<{
    type: 'question' | 'quiz';
    title: string;
    score?: number;
    timestamp: string;
  }>;
  progressBySubject: Array<{
    subject: string;
    topics: Array<{
      topic: string;
      mastery_score: number;
      questions_attempted: number;
    }>;
  }>;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  averageScore: number;
  rank: number;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Supabase JWT payload type
export interface SupabaseJWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  role?: string;
  email?: string;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export class CustomError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'CustomError';
  }
}
