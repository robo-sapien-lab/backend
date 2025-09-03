export declare class CloudStorageService {
    private bucket;
    constructor();
    uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, studentId: string): Promise<{
        fileUrl: string;
        filePath: string;
        fileSize: number;
    }>;
    deleteFile(filePath: string): Promise<void>;
    getFileMetadata(filePath: string): Promise<{
        name: string;
        size: number;
        contentType: string;
        timeCreated: Date;
        metadata: Record<string, string>;
    }>;
    generateSignedUrl(filePath: string, expirationMinutes?: number): Promise<string>;
    fileExists(filePath: string): Promise<boolean>;
    getFileSize(filePath: string): Promise<number>;
    listStudentFiles(studentId: string): Promise<Array<{
        name: string;
        size: number;
        contentType: string;
        timeCreated: Date;
        filePath: string;
    }>>;
    cleanupOldFiles(studentId: string, daysOld?: number): Promise<number>;
}
//# sourceMappingURL=cloudStorage.d.ts.map