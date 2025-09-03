export declare class VertexAIService {
    private model;
    constructor();
    generateAnswer(question: string, context: string, subject?: string, topic?: string, subtopic?: string): Promise<{
        answer: string;
        subject?: string;
        topic?: string;
        subtopic?: string;
    }>;
    generateQuizQuestions(context: string, subject?: string, topic?: string, subtopic?: string, questionCount?: number): Promise<Array<{
        question: string;
        options: string[];
        correct_answer: number;
        explanation: string;
    }>>;
    generateEmbeddings(text: string): Promise<number[]>;
    private buildPrompt;
    private buildQuizPrompt;
    private parseQuizQuestions;
    private generateFallbackQuestions;
    private extractSubjectInfo;
    private extractSubjectFromContext;
    private extractTopicFromContext;
    private extractSubtopicFromContext;
}
//# sourceMappingURL=vertexAI.d.ts.map