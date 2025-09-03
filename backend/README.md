# 🚀 Avyra EDAI Backend API

A comprehensive backend API for Avyra EDAI - an Educational AI Platform that leverages Google Cloud services to provide intelligent document processing, AI-powered Q&A, and personalized learning experiences.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Services](#services)
- [Database Schema](#database-schema)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Avyra EDAI Backend is a Node.js/TypeScript API that provides:

- **Document Processing**: Upload and extract text from educational materials using Google Document AI
- **AI-Powered Q&A**: Generate intelligent answers using Google Vertex AI with document context
- **Progress Tracking**: Monitor student learning progress and performance
- **Quiz Generation**: Create personalized quizzes based on uploaded materials
- **Cloud Storage**: Secure file management with Google Cloud Storage
- **Real-time Database**: Data persistence with Google Firestore

## ✨ Features

- 🔐 JWT-based authentication and authorization
- 📄 Document upload and text extraction
- 🤖 AI-powered question answering with context
- 📊 Student progress tracking and analytics
- 🧠 Intelligent quiz generation
- 🚀 High-performance API with rate limiting
- 🛡️ Security-first approach with Helmet and CORS
- 📱 RESTful API design
- 🐳 Docker containerization
- ☁️ Google Cloud Platform integration

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.0+
- **Framework**: Express.js 4.18+
- **Database**: Google Firestore
- **AI Services**: Google Vertex AI
- **Document Processing**: Google Document AI
- **Storage**: Google Cloud Storage

### Dependencies
- **Security**: Helmet, CORS, JWT, Rate Limiting
- **Validation**: Zod, Express Validator
- **File Handling**: Multer
- **Environment**: dotenv
- **Utilities**: UUID, JSON Web Token

### Development Tools
- **Build Tool**: TypeScript Compiler
- **Linting**: ESLint with TypeScript support
- **Testing**: Jest
- **Development Server**: ts-node-dev
- **Containerization**: Docker

## 🏗️ Architecture

```
src/
├── index.ts          # Server entry point
├── app.ts            # Express app configuration
├── functions.ts      # Cloud Functions entry point
├── middleware/
│   └── auth.ts      # JWT authentication middleware
├── routes/
│   ├── ask.ts       # AI Q&A endpoints
│   ├── upload.ts    # Document upload endpoints
│   ├── progress.ts  # Progress tracking endpoints
│   └── quiz.ts      # Quiz generation endpoints
├── services/
│   ├── vertexAI.ts      # Google Vertex AI integration
│   ├── documentAI.ts    # Google Document AI integration
│   ├── firestore.ts     # Firestore database operations
│   ├── cloudStorage.ts  # Google Cloud Storage operations
│   └── googleCloud.ts   # Google Cloud configuration
└── types/
    └── index.ts     # TypeScript type definitions
```

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Google Cloud Platform** account with billing enabled
- **Service Account Key** with appropriate permissions
- **Firestore Database** configured
- **Cloud Storage Bucket** created
- **Vertex AI API** enabled
- **Document AI API** enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Firestore Configuration
FIRESTORE_PROJECT_ID=your-project-id
FIRESTORE_COLLECTION_PREFIX=avyra

# Cloud Storage Configuration
CLOUD_STORAGE_BUCKET=your-bucket-name

# Vertex AI Configuration
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=text-bison@001

# Document AI Configuration
DOCUMENT_AI_LOCATION=us
DOCUMENT_AI_PROCESSOR_ID=your-processor-id

# Security Configuration
JWT_SECRET=your-jwt-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Supabase Configuration (if using)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Service Account Setup

1. Go to Google Cloud Console > IAM & Admin > Service Accounts
2. Create a new service account or use existing one
3. Assign the following roles:
   - **Firestore Admin**
   - **Storage Admin**
   - **Vertex AI User**
   - **Document AI API User**
4. Download the JSON key file
5. Place it in the project root as `service-account-key.json`

## 🔌 API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Endpoints

#### 1. Document Upload (`/upload`)
- **POST** `/upload` - Upload educational documents
- **GET** `/upload/:studentId` - Get student's uploaded documents
- **DELETE** `/upload/:documentId` - Delete a document

#### 2. AI Q&A (`/ask`)
- **POST** `/ask` - Ask questions and get AI-powered answers

#### 3. Progress Tracking (`/progress`)
- **GET** `/progress/:studentId` - Get student's learning progress
- **POST** `/progress/calculate` - Calculate and update progress

#### 4. Quiz Generation (`/quiz`)
- **POST** `/quiz/generate` - Generate personalized quizzes
- **GET** `/quiz/:studentId` - Get student's quiz history

### Request/Response Examples

#### Upload Document
```typescript
// Request
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt-token>

{
  "file": <file>,
  "studentId": "student123",
  "subject": "Mathematics",
  "topic": "Algebra",
  "subtopic": "Linear Equations"
}

// Response
{
  "success": true,
  "documentId": "doc123",
  "fileName": "algebra_notes.pdf",
  "extractedText": "Linear equations are...",
  "subject": "Mathematics",
  "topic": "Algebra",
  "subtopic": "Linear Equations"
}
```

#### Ask Question
```typescript
// Request
POST /api/ask
Authorization: Bearer <jwt-token>

{
  "question": "How do I solve linear equations?",
  "studentId": "student123"
}

// Response
{
  "answer": "To solve linear equations, you need to...",
  "sources": ["algebra_notes.pdf", "math_textbook.pdf"],
  "subject": "Mathematics",
  "topic": "Algebra",
  "subtopic": "Linear Equations"
}
```

## 🔧 Services

### Vertex AI Service
- **Purpose**: Generate AI-powered answers using Google's language models
- **Features**: Context-aware responses, subject classification, topic extraction
- **Configuration**: Model selection, temperature control, response length

### Document AI Service
- **Purpose**: Extract text and structure from uploaded documents
- **Supported Formats**: PDF, DOC, DOCX, images
- **Features**: Text extraction, layout analysis, table recognition

### Firestore Service
- **Purpose**: Database operations for documents, questions, and progress
- **Collections**: documents, questions, progress, students
- **Features**: Real-time updates, complex queries, data validation

### Cloud Storage Service
- **Purpose**: Secure file storage and management
- **Features**: File upload, download, deletion, metadata management

## 🗄️ Database Schema

### Collections

#### Documents
```typescript
interface Document {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  uploadDate: Date;
  lastModified: Date;
}
```

#### Questions
```typescript
interface Question {
  id: string;
  studentId: string;
  questionText: string;
  answerText: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  sourceChunks: SourceChunk[];
  createdAt: Date;
}
```

#### Progress
```typescript
interface Progress {
  id: string;
  studentId: string;
  totalDocuments: number;
  totalQuestions: number;
  subjects: SubjectProgress[];
  lastUpdated: Date;
}
```

## 🧪 Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run tests

# Docker
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container

# Deployment
npm run deploy:cloudrun      # Deploy to Google Cloud Run (Linux/Mac)
npm run deploy:cloudrun:win # Deploy to Google Cloud Run (Windows)
```

### Development Workflow
1. Make changes in `src/` directory
2. Run `npm run lint` to check code quality
3. Run `npm run build` to compile TypeScript
4. Test changes with `npm run dev`
5. Commit and push changes

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb style guide with TypeScript support
- **Prettier**: Automatic code formatting
- **Naming**: camelCase for variables, PascalCase for classes

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests for services
├── integration/    # Integration tests for API endpoints
└── fixtures/       # Test data and mocks
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t avyra-edai-backend .

# Run container
docker run -p 8080:8080 avyra-edai-backend
```

### Google Cloud Run Deployment
```bash
# Linux/Mac
./deploy-cloudrun.sh

# Windows
deploy-cloudrun.bat
```

### Manual Deployment
1. Build the project: `npm run build`
2. Set environment variables
3. Start the server: `npm start`
4. Use process manager (PM2) for production

## 🛡️ Security

### Security Features
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Request data validation
- **File Upload Security**: File type and size restrictions

### Best Practices
- Store sensitive data in environment variables
- Use HTTPS in production
- Implement proper error handling
- Regular security updates
- Monitor for suspicious activities

## 📊 Monitoring

### Health Checks
- **Endpoint**: `/health`
- **Response**: Server status, timestamp, environment
- **Usage**: Load balancer health checks, monitoring tools

### Logging
- Request/response logging
- Error logging with stack traces
- Performance metrics
- Security event logging

### Metrics
- Request count and response times
- Error rates
- Resource usage
- API endpoint usage

## 🔧 Troubleshooting

### Common Issues

#### 1. Google Cloud Authentication
```bash
# Error: Could not load the default credentials
# Solution: Set GOOGLE_APPLICATION_CREDENTIALS environment variable
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
```

#### 2. Port Already in Use
```bash
# Error: EADDRINUSE
# Solution: Change PORT in .env or kill existing process
lsof -ti:8080 | xargs kill -9
```

#### 3. TypeScript Compilation Errors
```bash
# Error: TypeScript compilation failed
# Solution: Check types and run build
npm run build
npm run lint
```

#### 4. Firestore Connection Issues
```bash
# Error: Firestore connection failed
# Solution: Verify project ID and service account permissions
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check environment variables
node -e "console.log(process.env)"
```

### Performance Issues
- Check rate limiting configuration
- Monitor database query performance
- Optimize file upload sizes
- Use caching where appropriate

## 📚 Additional Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is belongs to Surya.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Built with ❤️ by the Avyra Team**
