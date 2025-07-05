import fs from 'fs';
import path from 'path';

export interface ExtractedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
  difficulty_level: 'easy' | 'medium' | 'hard';
  confidence_score: number;
  page_number?: number;
}

export class EnhancedQuestionExtractor {
  private apiKey: string;

  constructor() {
    // Manually read API key from .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    this.apiKey = envVars['GOOGLE_GEMINI_API_KEY'];
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not found in environment');
    }
  }

  async extractQuestions(ocrText: string): Promise<ExtractedQuestion[]> {
    try {
      console.log('🤖 Extracting questions with enhanced Gemini AI...');
      console.log(`📝 Processing ${ocrText.length} characters of OCR text`);
      
      // Split text into chunks if too large (Gemini has input limits)
      const maxChunkSize = 30000; // Conservative limit
      const chunks = this.splitTextIntoChunks(ocrText, maxChunkSize);
      
      console.log(`📦 Split into ${chunks.length} chunks for processing`);
      
      let allQuestions: ExtractedQuestion[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}...`);
        
        const chunkQuestions = await this.processTextChunk(chunks[i], i + 1);
        allQuestions.push(...chunkQuestions);
        
        // Small delay between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Remove duplicates and validate
      const uniqueQuestions = this.removeDuplicateQuestions(allQuestions);
      const validQuestions = this.validateAndCleanQuestions(uniqueQuestions);
      
      console.log(`✅ Extracted ${validQuestions.length} unique, valid questions`);
      return validQuestions;
    } catch (error) {
      console.error('❌ Question extraction failed:', error);
      return [];
    }
  }

  private splitTextIntoChunks(text: string, maxSize: number): string[] {
    if (text.length <= maxSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const lines = text.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
      }
      currentChunk += (currentChunk ? '\n' : '') + line;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private async processTextChunk(text: string, chunkNumber: number): Promise<ExtractedQuestion[]> {
    try {
      const enhancedPrompt = this.createEnhancedPrompt(text);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
                                    maxOutputTokens: 4096,
            candidateCount: 1