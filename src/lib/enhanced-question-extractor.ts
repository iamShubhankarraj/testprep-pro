import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
    const envPath = join(process.cwd(), '.env.local');
    
    if (!existsSync(envPath)) {
      throw new Error('.env.local file not found');
    }
    
    const envContent = readFileSync(envPath, 'utf8');
    
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    const apiKey = envVars['GOOGLE_GEMINI_API_KEY'];
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GOOGLE_GEMINI_API_KEY not found in .env.local file');
    }
    
    this.apiKey = apiKey.trim();
    console.log('✅ Gemini API key loaded successfully');
  }

  async extractQuestions(ocrText: string, pageNumber: number): Promise<ExtractedQuestion[]> {
    try {
      console.log(`🤖 Extracting questions with Gemini 1.5 Pro from page ${pageNumber}...`);
      
      if (ocrText.length < 100) {
        console.log(`⚠️ Page ${pageNumber}: OCR text too short, skipping.`);
        return [];
      }
      
      const extracted = await this.processTextChunk(ocrText, pageNumber);
      
      const uniqueQuestions = this.removeDuplicateQuestions(extracted);
      const validQuestions = this.validateAndCleanQuestions(uniqueQuestions, pageNumber);
      
      console.log(`✅ Page ${pageNumber}: Found ${validQuestions.length} unique, valid questions.`);
      return validQuestions;

    } catch (error) {
      console.error(`❌ Question extraction failed for page ${pageNumber}:`, error);
      return [];
    }
  }

  private async processTextChunk(text: string, chunkNumber: number): Promise<ExtractedQuestion[]> {
    try {
      const enhancedPrompt = this.createEnhancedPrompt(text);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`, {
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
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            candidateCount: 1
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error for chunk ${chunkNumber}:`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        if(data.candidates?.[0]?.finishReason) {
            console.log(`⚠️ Generation finished with reason: ${data.candidates?.[0]?.finishReason}`);
        }
        return [];
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      console.log(`📝 Generated ${generatedText.length} characters for chunk ${chunkNumber}`);
      
      return this.parseAIResponse(generatedText, chunkNumber);
    } catch (error) {
      console.error(`❌ Failed to process chunk ${chunkNumber}:`, error);
      return [];
    }
  }

  private createEnhancedPrompt(text: string): string {
    return `
You are an expert AI for extracting Multiple Choice Questions from OCR text of a single page from a competitive exam PDF (like JEE/NEET). Your task is to be thorough and extract every single valid question.

PAGE OCR TEXT:
${text}

TASK: Extract ALL multiple-choice questions from the page text. Follow these requirements strictly:

1.  **JSON Array Format**: Your entire output MUST be a valid JSON array of question objects.
2.  **Completeness**: EVERY question object must contain all fields: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "subject", "difficulty_level", and "confidence_score". "explanation" is optional.
3.  **Data Types**: All option fields MUST be strings.
4.  **Error Correction**: Correct common OCR errors. Be aggressive in fixing malformed questions and options.
5.  **Subject Classification**: Classify into 'Physics', 'Chemistry', 'Mathematics', or 'Biology'.
6.  **Difficulty Estimation**: Rate difficulty as 'easy', 'medium', or 'hard'.
7.  **Confidence Score**: Provide a confidence score from 0.0 to 1.0.

Here is the required JSON structure:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "explanation": "...",
    "subject": "Physics",
    "difficulty_level": "easy",
    "confidence_score": 0.95
  }
]

**IMPORTANT RULES:**
- Return ONLY a valid JSON array.
- If no questions are found, return an empty array: [].
- "correct_answer" MUST be ONLY 'A', 'B', 'C', or 'D'.
- If an option is missing or unreadable, use "N/A" as a placeholder. DO NOT omit the field.
- Be exhaustive. Find every single question on the page.
`;
  }

  private parseAIResponse(text: string, chunkNumber: number): ExtractedQuestion[] {
    try {
      let cleanedText = text.trim();
      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) return [];
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      const questions = JSON.parse(cleanedText);
      if (!Array.isArray(questions)) return [];
      console.log(`📊 Parsed ${questions.length} questions from chunk ${chunkNumber}`);
      return questions;
    } catch (error) {
      console.error(`❌ Failed to parse AI response for chunk ${chunkNumber}:`, error);
      return [];
    }
  }

  private removeDuplicateQuestions(questions: ExtractedQuestion[]): ExtractedQuestion[] {
    const seen = new Set<string>();
    return questions.filter(q => {
      if (!q?.question_text) return false;
      const key = q.question_text.toLowerCase().replace(/\s+/g, '').substring(0, 100);
      if (seen.has(key)) {
        console.log('🔄 Removed duplicate question:', q.question_text.substring(0, 50) + '...');
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private validateAndCleanQuestions(questions: any[], pageNumber: number): ExtractedQuestion[] {
    const validQuestions: ExtractedQuestion[] = [];
    for (const question of questions) {
      const cleaned = this.cleanQuestion(question, pageNumber);
      if (this.isValidQuestion(cleaned)) {
        validQuestions.push(cleaned);
      } else {
        console.log('❌ Invalid question filtered out:', question.question_text?.substring(0, 50) + '...');
      }
    }
    return validQuestions;
  }

  private isValidQuestion(q: any): boolean {
    if (!q || typeof q !== 'object') return false;
    const requiredFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'subject', 'difficulty_level', 'confidence_score'];
    for (const field of requiredFields) {
      if (q[field] === undefined || q[field] === null) return false;
    }
    if (q.question_text.length < 10) return false;
    if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) return false;
    return true;
  }

  private cleanQuestion(q: any, pageNumber: number): ExtractedQuestion {
    return {
      question_text: String(q.question_text || ''),
      option_a: String(q.option_a || ''),
      option_b: String(q.option_b || ''),
      option_c: String(q.option_c || ''),
      option_d: String(q.option_d || ''),
      correct_answer: String(q.correct_answer || 'A').toUpperCase().charAt(0) as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation ? String(q.explanation) : undefined,
      subject: q.subject || 'Physics',
      difficulty_level: q.difficulty_level || 'medium',
      confidence_score: Number(q.confidence_score) || 0.5,
      page_number: pageNumber
    };
  }

  public getExtractionStats(questions: ExtractedQuestion[]) {
    const stats = {
      total: questions.length,
      bySubject: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      averageConfidence: 0
    };
    for (const question of questions) {
      stats.bySubject[question.subject] = (stats.bySubject[question.subject] || 0) + 1;
      stats.byDifficulty[question.difficulty_level] = (stats.byDifficulty[question.difficulty_level] || 0) + 1;
    }
    if (questions.length > 0) {
      const totalConfidence = questions.reduce((sum, q) => sum + q.confidence_score, 0);
      stats.averageConfidence = Math.round((totalConfidence / questions.length) * 100) / 100;
    }
    return stats;
  }
}

