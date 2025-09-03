import { getStorageBucket } from './googleCloud';
import { CustomError } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class CloudStorageService {
  private bucket: any;

  constructor() {
    this.bucket = getStorageBucket();
  }

  /**
   * Upload a file to Cloud Storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    studentId: string
  ): Promise<{
    fileUrl: string;
    filePath: string;
    fileSize: number;
  }> {
    try {
      // Generate unique file path
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `uploads/${studentId}/${uniqueFileName}`;
      
      // Create file object
      const file = this.bucket.file(filePath);
      
      // Upload file with metadata
      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            originalName: fileName,
            studentId: studentId,
            uploadedAt: new Date().toISOString(),
          },
        },
        resumable: false, // For smaller files, use non-resumable uploads
      });

      // Make file publicly readable (or implement signed URLs for security)
      await file.makePublic();
      
      // Get public URL
      const fileUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
      
      return {
        fileUrl,
        filePath,
        fileSize: fileBuffer.length,
      };
    } catch (error) {
      console.error('Error uploading file to Cloud Storage:', error);
      throw new CustomError(
        'Failed to upload file',
        500,
        'STORAGE_UPLOAD_ERROR'
      );
    }
  }

  /**
   * Delete a file from Cloud Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
    } catch (error) {
      console.error('Error deleting file from Cloud Storage:', error);
      throw new CustomError(
        'Failed to delete file',
        500,
        'STORAGE_DELETE_ERROR'
      );
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<{
    name: string;
    size: number;
    contentType: string;
    timeCreated: Date;
    metadata: Record<string, string>;
  }> {
    try {
      const file = this.bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      
      return {
        name: metadata.name,
        size: parseInt(metadata.size),
        contentType: metadata.contentType,
        timeCreated: new Date(metadata.timeCreated),
        metadata: metadata.metadata || {},
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new CustomError(
        'Failed to get file metadata',
        500,
        'STORAGE_METADATA_ERROR'
      );
    }
  }

  /**
   * Generate signed URL for secure file access (optional)
   */
  async generateSignedUrl(
    filePath: string,
    expirationMinutes: number = 60
  ): Promise<string> {
    try {
      const file = this.bucket.file(filePath);
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });
      
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new CustomError(
        'Failed to generate signed URL',
        500,
        'STORAGE_SIGNED_URL_ERROR'
      );
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error checking if file exists:', error);
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const file = this.bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      return parseInt(metadata.size);
    } catch (error) {
      console.error('Error getting file size:', error);
      throw new CustomError(
        'Failed to get file size',
        500,
        'STORAGE_SIZE_ERROR'
      );
    }
  }

  /**
   * List files for a specific student
   */
  async listStudentFiles(studentId: string): Promise<Array<{
    name: string;
    size: number;
    contentType: string;
    timeCreated: Date;
    filePath: string;
  }>> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `uploads/${studentId}/`,
        delimiter: '/',
      });

      const fileList = await Promise.all(
        files.map(async (file: any) => {
          const [metadata] = await file.getMetadata();
          return {
            name: metadata.name.split('/').pop(),
            size: parseInt(metadata.size),
            contentType: metadata.contentType,
            timeCreated: new Date(metadata.timeCreated),
            filePath: file.name,
          };
        })
      );

      return fileList.sort((a, b) => b.timeCreated.getTime() - a.timeCreated.getTime());
    } catch (error) {
      console.error('Error listing student files:', error);
      throw new CustomError(
        'Failed to list files',
        500,
        'STORAGE_LIST_ERROR'
      );
    }
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(
    studentId: string,
    daysOld: number = 30
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const [files] = await this.bucket.getFiles({
        prefix: `uploads/${studentId}/`,
      });

      let deletedCount = 0;
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const fileDate = new Date(metadata.timeCreated);
        
        if (fileDate < cutoffDate) {
          await file.delete();
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      throw new CustomError(
        'Failed to cleanup old files',
        500,
        'STORAGE_CLEANUP_ERROR'
      );
    }
  }
}
