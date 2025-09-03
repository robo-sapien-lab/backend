"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudStorageService = void 0;
const googleCloud_1 = require("./googleCloud");
const types_1 = require("../types");
const uuid_1 = require("uuid");
class CloudStorageService {
    constructor() {
        this.bucket = (0, googleCloud_1.getStorageBucket)();
    }
    async uploadFile(fileBuffer, fileName, mimeType, studentId) {
        try {
            const fileExtension = fileName.split('.').pop();
            const uniqueFileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
            const filePath = `uploads/${studentId}/${uniqueFileName}`;
            const file = this.bucket.file(filePath);
            await file.save(fileBuffer, {
                metadata: {
                    contentType: mimeType,
                    metadata: {
                        originalName: fileName,
                        studentId: studentId,
                        uploadedAt: new Date().toISOString(),
                    },
                },
                resumable: false,
            });
            await file.makePublic();
            const fileUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
            return {
                fileUrl,
                filePath,
                fileSize: fileBuffer.length,
            };
        }
        catch (error) {
            console.error('Error uploading file to Cloud Storage:', error);
            throw new types_1.CustomError('Failed to upload file', 500, 'STORAGE_UPLOAD_ERROR');
        }
    }
    async deleteFile(filePath) {
        try {
            const file = this.bucket.file(filePath);
            await file.delete();
        }
        catch (error) {
            console.error('Error deleting file from Cloud Storage:', error);
            throw new types_1.CustomError('Failed to delete file', 500, 'STORAGE_DELETE_ERROR');
        }
    }
    async getFileMetadata(filePath) {
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
        }
        catch (error) {
            console.error('Error getting file metadata:', error);
            throw new types_1.CustomError('Failed to get file metadata', 500, 'STORAGE_METADATA_ERROR');
        }
    }
    async generateSignedUrl(filePath, expirationMinutes = 60) {
        try {
            const file = this.bucket.file(filePath);
            const [signedUrl] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expirationMinutes * 60 * 1000,
            });
            return signedUrl;
        }
        catch (error) {
            console.error('Error generating signed URL:', error);
            throw new types_1.CustomError('Failed to generate signed URL', 500, 'STORAGE_SIGNED_URL_ERROR');
        }
    }
    async fileExists(filePath) {
        try {
            const file = this.bucket.file(filePath);
            const [exists] = await file.exists();
            return exists;
        }
        catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    }
    async getFileSize(filePath) {
        try {
            const file = this.bucket.file(filePath);
            const [metadata] = await file.getMetadata();
            return parseInt(metadata.size);
        }
        catch (error) {
            console.error('Error getting file size:', error);
            throw new types_1.CustomError('Failed to get file size', 500, 'STORAGE_SIZE_ERROR');
        }
    }
    async listStudentFiles(studentId) {
        try {
            const [files] = await this.bucket.getFiles({
                prefix: `uploads/${studentId}/`,
                delimiter: '/',
            });
            const fileList = await Promise.all(files.map(async (file) => {
                const [metadata] = await file.getMetadata();
                return {
                    name: metadata.name.split('/').pop(),
                    size: parseInt(metadata.size),
                    contentType: metadata.contentType,
                    timeCreated: new Date(metadata.timeCreated),
                    filePath: file.name,
                };
            }));
            return fileList.sort((a, b) => b.timeCreated.getTime() - a.timeCreated.getTime());
        }
        catch (error) {
            console.error('Error listing student files:', error);
            throw new types_1.CustomError('Failed to list files', 500, 'STORAGE_LIST_ERROR');
        }
    }
    async cleanupOldFiles(studentId, daysOld = 30) {
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
        }
        catch (error) {
            console.error('Error cleaning up old files:', error);
            throw new types_1.CustomError('Failed to cleanup old files', 500, 'STORAGE_CLEANUP_ERROR');
        }
    }
}
exports.CloudStorageService = CloudStorageService;
//# sourceMappingURL=cloudStorage.js.map