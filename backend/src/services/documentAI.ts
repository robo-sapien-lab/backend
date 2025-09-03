import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { getDocumentAiProcessor } from './googleCloud';
import { CustomError } from '../types';

export class DocumentAIService {
  private client: DocumentProcessorServiceClient;
  private processorPath: string;

  constructor() {
    this.client = new DocumentProcessorServiceClient();
    this.processorPath = getDocumentAiProcessor();
  }

  /**
   * Extract text from uploaded documents using Document AI
   */
  async extractText(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    try {
      // Convert file to Document AI format
      const rawDocument = {
        content: fileBuffer.toString('base64'),
        mimeType: mimeType,
      };

      // Process the document
      const request = {
        name: this.processorPath,
        rawDocument: rawDocument,
      };

      const [result] = await this.client.processDocument(request);
      const { document } = result;

      if (!document) {
        throw new CustomError('No document content extracted', 400, 'DOCUMENT_PROCESSING_ERROR');
      }

      // Extract text from the processed document
      const text = this.extractTextFromDocument(document);
      
      if (!text || text.trim().length === 0) {
        throw new CustomError('No text content found in document', 400, 'NO_TEXT_CONTENT');
      }

      return text.trim();
    } catch (error) {
      console.error('Error extracting text with Document AI:', error);
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError(
        'Failed to extract text from document',
        500,
        'DOCUMENT_AI_ERROR'
      );
    }
  }

  /**
   * Extract text content from Document AI response
   */
  private extractTextFromDocument(document: any): string {
    let text = '';

    // Extract text from pages
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

    // If no text extracted from blocks, try paragraphs
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

    // If still no text, try lines
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

    // If still no text, try tokens
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

    // Fallback: use the raw text if available
    if (!text && document.text) {
      text = document.text;
    }

    return text;
  }

  /**
   * Extract text from text anchor using character offsets
   */
  private extractTextFromTextAnchor(textAnchor: any, fullText: string): string {
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

  /**
   * Get document metadata (page count, confidence scores, etc.)
   */
  async getDocumentMetadata(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{
    pageCount: number;
    confidence: number;
    textLength: number;
  }> {
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
        throw new CustomError('No document content extracted', 400, 'DOCUMENT_PROCESSING_ERROR');
      }

      return {
        pageCount: document.pages ? document.pages.length : 0,
        confidence: document.pages && document.pages.length > 0 
          ? document.pages.reduce((sum, page) => sum + ((page as any).confidence || 0), 0) / document.pages.length
          : 0,
        textLength: document.text ? document.text.length : 0
      };
    } catch (error) {
      console.error('Error getting document metadata:', error);
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError(
        'Failed to get document metadata',
        500,
        'DOCUMENT_AI_ERROR'
      );
    }
  }

  /**
   * Check if the document type is supported
   */
  isSupportedDocumentType(mimeType: string): boolean {
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

  /**
   * Get the recommended processor for a given document type
   */
  getRecommendedProcessor(mimeType: string): string {
    if (mimeType === 'application/pdf') {
      return 'OCR_PROCESSOR'; // Use OCR processor for PDFs
    } else if (mimeType.startsWith('image/')) {
      return 'OCR_PROCESSOR'; // Use OCR processor for images
    } else {
      return 'OCR_PROCESSOR'; // Default to OCR processor
    }
  }
}
