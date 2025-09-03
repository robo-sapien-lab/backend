import dotenv from 'dotenv';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { VertexAI } from '@google-cloud/vertexai';
dotenv.config();
// Initialize Google Cloud clients
export const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
});

export const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
});

export const documentAiClient = new DocumentProcessorServiceClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
});

export const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1',
});

// Get the bucket for file uploads
export const getStorageBucket = () => {
  const bucketName = process.env.CLOUD_STORAGE_BUCKET;
  if (!bucketName) {
    throw new Error('CLOUD_STORAGE_BUCKET environment variable is not set');
  }
  return storage.bucket(bucketName);
};

// Get Document AI processor
export const getDocumentAiProcessor = () => {
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
  
  if (!processorId) {
    throw new Error('DOCUMENT_AI_PROCESSOR_ID environment variable is not set');
  }
  
  return `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us/processors/${processorId}`;
};

// Get Vertex AI model
export const getVertexAiModel = () => {
  const model = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash';
  
  return vertexAI.preview.getGenerativeModel({
    model: model,
    generation_config: {
      max_output_tokens: 2048,
      temperature: 0.1,
      top_p: 0.8,
      top_k: 40,
    },
  });
};

// Validate environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'CLOUD_STORAGE_BUCKET',
    'DOCUMENT_AI_PROCESSOR_ID',
    'SUPABASE_JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};
