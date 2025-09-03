import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { VertexAI } from '@google-cloud/vertexai';
export declare const firestore: Firestore;
export declare const storage: Storage;
export declare const documentAiClient: import("@google-cloud/documentai/build/src/v1").DocumentProcessorServiceClient;
export declare const vertexAI: VertexAI;
export declare const getStorageBucket: () => import("@google-cloud/storage").Bucket;
export declare const getDocumentAiProcessor: () => string;
export declare const getVertexAiModel: () => import("@google-cloud/vertexai").GenerativeModel;
export declare const validateEnvironment: () => void;
//# sourceMappingURL=googleCloud.d.ts.map