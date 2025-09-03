export declare class DocumentAIService {
    private client;
    private processorPath;
    constructor();
    extractText(fileBuffer: Buffer, mimeType: string): Promise<string>;
    private extractTextFromDocument;
    private extractTextFromTextAnchor;
    getDocumentMetadata(fileBuffer: Buffer, mimeType: string): Promise<{
        pageCount: number;
        confidence: number;
        textLength: number;
    }>;
    isSupportedDocumentType(mimeType: string): boolean;
    getRecommendedProcessor(mimeType: string): string;
}
//# sourceMappingURL=documentAI.d.ts.map