"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = exports.getVertexAiModel = exports.getDocumentAiProcessor = exports.getStorageBucket = exports.vertexAI = exports.documentAiClient = exports.storage = exports.firestore = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const firestore_1 = require("@google-cloud/firestore");
const storage_1 = require("@google-cloud/storage");
const documentai_1 = require("@google-cloud/documentai");
const vertexai_1 = require("@google-cloud/vertexai");
dotenv_1.default.config();
exports.firestore = new firestore_1.Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
});
exports.storage = new storage_1.Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});
exports.documentAiClient = new documentai_1.DocumentProcessorServiceClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});
exports.vertexAI = new vertexai_1.VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: process.env.VERTEX_AI_LOCATION || 'us-central1',
});
const getStorageBucket = () => {
    const bucketName = process.env.CLOUD_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error('CLOUD_STORAGE_BUCKET environment variable is not set');
    }
    return exports.storage.bucket(bucketName);
};
exports.getStorageBucket = getStorageBucket;
const getDocumentAiProcessor = () => {
    const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
    if (!processorId) {
        throw new Error('DOCUMENT_AI_PROCESSOR_ID environment variable is not set');
    }
    return `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us/processors/${processorId}`;
};
exports.getDocumentAiProcessor = getDocumentAiProcessor;
const getVertexAiModel = () => {
    const model = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash';
    return exports.vertexAI.preview.getGenerativeModel({
        model: model,
        generation_config: {
            max_output_tokens: 2048,
            temperature: 0.1,
            top_p: 0.8,
            top_k: 40,
        },
    });
};
exports.getVertexAiModel = getVertexAiModel;
const validateEnvironment = () => {
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
exports.validateEnvironment = validateEnvironment;
//# sourceMappingURL=googleCloud.js.map