import dotenv from 'dotenv';
import { getVertexAiModel } from './googleCloud';
import { CustomError } from '../types';

dotenv.config();
export class VertexAIService {
  private model: any;

  constructor() {
    this.model = getVertexAiModel();
  }

  /**
   * Generate an answer to a student's question using Vertex AI Gemini
   */
  async generateAnswer(
    question: string,
    context: string,
    subject?: string,
    topic?: string,
    subtopic?: string
  ): Promise<{
    answer: string;
    subject?: string;
    topic?: string;
    subtopic?: string;
  }> {
    try {
      // Build the prompt with context and question
      const prompt = this.buildPrompt(question, context, subject, topic, subtopic);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const answer = response.candidates[0].content.parts[0].text;

      if (!answer) {
        throw new CustomError('Failed to generate answer from Vertex AI', 500, 'AI_GENERATION_ERROR');
      }

      // Extract subject/topic information from the context or use provided values
      const extractedInfo = this.extractSubjectInfo(context, subject, topic, subtopic);

      return {
        answer: answer.trim(),
        ...extractedInfo
      };
    } catch (error) {
      console.error('Error generating answer with Vertex AI:', error);
      throw new CustomError(
        'Failed to generate AI response',
        500,
        'AI_SERVICE_ERROR'
      );
    }
  }

  /**
   * Generate quiz questions based on uploaded materials
   */
  async generateQuizQuestions(
    context: string,
    subject?: string,
    topic?: string,
    subtopic?: string,
    questionCount: number = 5
  ): Promise<Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>> {
    try {
      const prompt = this.buildQuizPrompt(context, subject, topic, subtopic, questionCount);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      const content = response.candidates[0].content.parts[0].text;

      // Parse the generated quiz questions
      return this.parseQuizQuestions(content);
    } catch (error) {
      console.error('Error generating quiz questions with Vertex AI:', error);
      throw new CustomError(
        'Failed to generate quiz questions',
        500,
        'AI_SERVICE_ERROR'
      );
    }
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      // For now, we'll use a simple approach
      // In production, you might want to use a dedicated embeddings model
      const prompt = `Generate a numerical representation for this text: ${text}`;
      
      await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      // This is a placeholder - you'd need to implement proper embedding generation
      // Consider using a dedicated embeddings service or model
      return [];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      return [];
    }
  }

  private buildPrompt(
    question: string,
    context: string,
    subject?: string,
    topic?: string,
    subtopic?: string
  ): string {
    let prompt = `You are an AI tutor helping a student with their studies. `;
    
    if (subject) prompt += `The subject is: ${subject}. `;
    if (topic) prompt += `The topic is: ${topic}. `;
    if (subtopic) prompt += `The subtopic is: ${subtopic}. `;
    
    prompt += `\n\nContext from the student's uploaded materials:\n${context}\n\n`;
    prompt += `Student's question: ${question}\n\n`;
    prompt += `Please provide a clear, educational answer based on the context provided. `;
    prompt += `If the context doesn't contain enough information to answer the question, `;
    prompt += `say so and suggest what additional information might be needed. `;
    prompt += `Keep your answer helpful, accurate, and appropriate for a student.`;

    return prompt;
  }

  private buildQuizPrompt(
    context: string,
    subject?: string,
    topic?: string,
    subtopic?: string,
    questionCount: number = 5
  ): string {
    let prompt = `Generate ${questionCount} multiple-choice quiz questions based on this educational content. `;
    
    if (subject) prompt += `Subject: ${subject}. `;
    if (topic) prompt += `Topic: ${topic}. `;
    if (subtopic) prompt += `Subtopic: ${subtopic}. `;
    
    prompt += `\n\nContent:\n${context}\n\n`;
    prompt += `For each question, provide:\n`;
    prompt += `1. A clear question\n`;
    prompt += `2. Four answer options (A, B, C, D)\n`;
    prompt += `3. The correct answer (0-3, where 0=A, 1=B, 2=C, 3=D)\n`;
    prompt += `4. A brief explanation of why the answer is correct\n\n`;
    prompt += `Format your response as a JSON array with this structure:\n`;
    prompt += `[{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "..."}]`;

    return prompt;
  }

  private parseQuizQuestions(content: string): Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: generate basic questions if parsing fails
      return this.generateFallbackQuestions();
    } catch (error) {
      console.error('Error parsing quiz questions:', error);
      return this.generateFallbackQuestions();
    }
  }

  private generateFallbackQuestions(): Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }> {
    return [
      {
        question: "What is the main topic discussed in the uploaded materials?",
        options: [
          "A general overview",
          "Specific technical details",
          "Historical context",
          "Future applications"
        ],
        correct_answer: 1,
        explanation: "The materials focus on specific technical details and concepts."
      }
    ];
  }

  private extractSubjectInfo(
    context: string,
    subject?: string,
    topic?: string,
    subtopic?: string
  ): {
    subject?: string;
    topic?: string;
    subtopic?: string;
  } {
    // Use provided values or try to extract from context
    const extractedSubject = subject || this.extractSubjectFromContext(context);
    const extractedTopic = topic || this.extractTopicFromContext(context);
    const extractedSubtopic = subtopic || this.extractSubtopicFromContext(context);
    
    return {
      ...(extractedSubject ? { subject: extractedSubject } : {}),
      ...(extractedTopic ? { topic: extractedTopic } : {}),
      ...(extractedSubtopic ? { subtopic: extractedSubtopic } : {})
    };
  }

  private extractSubjectFromContext(context: string): string | undefined {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'literature'];
    const lowerContext = context.toLowerCase();
    
    for (const subject of subjects) {
      if (lowerContext.includes(subject)) {
        return subject.charAt(0).toUpperCase() + subject.slice(1);
      }
    }
    
    return undefined;
  }

  private extractTopicFromContext(context: string): string | undefined {
    // Extract potential topics from context
    const lines = context.split('\n').slice(0, 5); // Look at first few lines
    for (const line of lines) {
      if (line.length > 10 && line.length < 100) {
        return line.trim();
      }
    }
    return undefined;
  }

  private extractSubtopicFromContext(context: string): string | undefined {
    // Extract potential subtopics
    const words = context.split(' ').slice(0, 50); // Look at first 50 words
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 3 && words[i + 1].length > 3) {
        return `${words[i]} ${words[i + 1]}`;
      }
    }
    return undefined;
  }
}
