"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAIService = void 0;
const documentai_1 = require("@google-cloud/documentai");
const googleCloud_1 = require("./googleCloud");
const types_1 = require("../types");
class DocumentAIService {
    constructor() {
        this.client = new documentai_1.DocumentProcessorServiceClient();
        this.processorPath = (0, googleCloud_1.getDocumentAiProcessor)();
    }
    async extractText(fileBuffer, mimeType) {
        try {
            const rawDocument = {
                content: fileBuffer.toString('base64'),
                mimeType: mimeType,
            };
            const request = {
                name: this.processorPath,
                rawDocument: rawDocument,
            };
            const [result] = await this.client.processDocument(request);
            const { document } = result;
            if (!document) {
                throw new types_1.CustomError('No document content extracted', 400, 'DOCUMENT_PROCESSING_ERROR');
            }
            const text = this.extractTextFromDocument(document);
            if (!text || text.trim().length === 0) {
                throw new types_1.CustomError('No text content found in document', 400, 'NO_TEXT_CONTENT');
            }
            return text.trim();
        }
        catch (error) {
            console.error('Error extracting text with Document AI:', error);
            if (error instanceof types_1.CustomError) {
                throw error;
            }
            throw new types_1.CustomError('Failed to extract text from document', 500, 'DOCUMENT_AI_ERROR');
        }
    }
    extractTextFromDocument(document) {
        let text = '';
        if (document.pages && document.pages.length > 0) {
            for (const page of document.pages) {
                if (page.blocks) {
                    for (const block of page.blocks) {
                        if (block.layout && block.layout.textAnchor) {
                            const blockText = this.extractTextFromTextAnchor(block.layout.textAnchor, document.text);
                            if (blockText) {
                                text += blockText + '\n';
                            }
                        }
                    }
                }
            }
        }
        if (!text && document.pages && document.pages.length > 0) {
            for (const page of document.pages) {
                if (page.paragraphs) {
                    for (const paragraph of page.paragraphs) {
                        if (paragraph.layout && paragraph.layout.textAnchor) {
                            const paragraphText = this.extractTextFromTextAnchor(paragraph.layout.textAnchor, document.text);
                            if (paragraphText) {
                                text += paragraphText + '\n';
                            }
                        }
                    }
                }
            }
        }
        if (!text && document.pages && document.pages.length > 0) {
            for (const page of document.pages) {
                if (page.lines) {
                    for (const line of page.lines) {
                        if (line.layout && line.layout.textAnchor) {
                            const lineText = this.extractTextFromTextAnchor(line.layout.textAnchor, document.text);
                            if (lineText) {
                                text += lineText + '\n';
                            }
                        }
                    }
                }
            }
        }
        if (!text && document.pages && document.pages.length > 0) {
            for (const page of document.pages) {
                if (page.tokens) {
                    for (const token of page.tokens) {
                        if (token.layout && token.layout.textAnchor) {
                            const tokenText = this.extractTextFromTextAnchor(token.layout.textAnchor, document.text);
                            if (tokenText) {
                                text += tokenText + ' ';
                            }
                        }
                    }
                }
            }
        }
        if (!text && document.text) {
            text = document.text;
        }
        return text;
    }
    extractTextFromTextAnchor(textAnchor, fullText) {
        if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
            return '';
        }
        let extractedText = '';
        for (const segment of textAnchor.textSegments) {
            if (segment.startIndex !== undefined && segment.endIndex !== undefined) {
                const start = parseInt(segment.startIndex);
                const end = parseInt(segment.endIndex);
                if (start >= 0 && end <= fullText.length && start < end) {
                    extractedText += fullText.substring(start, end);
                }
            }
        }
        return extractedText;
    }
    async getDocumentMetadata(fileBuffer, mimeType) {
        try {
            const rawDocument = {
                content: fileBuffer.toString('base64'),
                mimeType: mimeType,
            };
            const request = {
                name: this.processorPath,
                rawDocument: rawDocument,
            };
            const [result] = await this.client.processDocument(request);
            const { document } = result;
            if (!document) {
                throw new types_1.CustomError('No document content extracted', 400, 'DOCUMENT_PROCESSING_ERROR');
            }
            return {
                pageCount: document.pages ? document.pages.length : 0,
                confidence: document.pages && document.pages.length > 0
                    ? document.pages.reduce((sum, page) => sum + (page.confidence || 0), 0) / document.pages.length
                    : 0,
                textLength: document.text ? document.text.length : 0
            };
        }
        catch (error) {
            console.error('Error getting document metadata:', error);
            if (error instanceof types_1.CustomError) {
                throw error;
            }
            throw new types_1.CustomError('Failed to get document metadata', 500, 'DOCUMENT_AI_ERROR');
        }
    }
    isSupportedDocumentType(mimeType) {
        const supportedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/tiff',
            'image/bmp'
        ];
        return supportedTypes.includes(mimeType);
    }
    getRecommendedProcessor(mimeType) {
        if (mimeType === 'application/pdf') {
            return 'OCR_PROCESSOR';
        }
        else if (mimeType.startsWith('image/')) {
            return 'OCR_PROCESSOR';
        }
        else {
            return 'OCR_PROCESSOR';
        }
    }
}
exports.DocumentAIService = DocumentAIService;
//# sourceMappingURL=documentAI.js.map