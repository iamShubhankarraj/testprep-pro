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
    // Prefer environment variable for Vercel; fallback to .env.local for local dev
    const envApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (envApiKey && envApiKey.trim() !== '') {
      this.apiKey = envApiKey.trim();
      console.log('✅ Gemini API key loaded from environment');
      return;
    }

    const envPath = join(process.cwd(), '.env.local');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      const envVars: Record<string, string> = {};
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });
      const fileKey = envVars['GOOGLE_GEMINI_API_KEY'];
      if (fileKey && fileKey.trim() !== '') {
        this.apiKey = fileKey.trim();
        console.log('✅ Gemini API key loaded from .env.local');
        return;
      }
    }

    throw new Error('GOOGLE_GEMINI_API_KEY not found. Set it in environment variables (e.g., Vercel Project Settings) or in a local .env.local for development.');
  }

  async extractQuestions(ocrText: string): Promise<ExtractedQuestion[]> {
    try {
      console.log('🤖 Extracting questions with enhanced Gemini AI...');
      console.log(`📝 Processing ${ocrText.length} characters of OCR text`);
      
      if (ocrText.length < 100) {
        console.log('⚠️ OCR text too short, likely no meaningful content');
        return [];
      }
      
      // Split text into chunks if too large (Gemini has input limits)
      const maxChunkSize = 25000; // Conservative limit for Gemini
      const chunks = this.splitTextIntoChunks(ocrText, maxChunkSize);
      
      console.log(`📦 Split into ${chunks.length} chunks for processing`);
      
      let allQuestions: ExtractedQuestion[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}...`);
        
        try {
          const chunkQuestions = await this.processTextChunk(chunks[i], i + 1);
          allQuestions.push(...chunkQuestions);
          console.log(`✅ Chunk ${i + 1}: Found ${chunkQuestions.length} questions`);
        } catch (error) {
          console.error(`❌ Failed to process chunk ${i + 1}:`, error);
          // Continue with other chunks
        }
        
        // Delay between chunks to respect rate limits
        if (i < chunks.length - 1) {
          console.log('⏳ Waiting 2 seconds before next chunk...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`📊 Total questions found: ${allQuestions.length}`);
      
      // Remove duplicates and validate
      const uniqueQuestions = this.removeDuplicateQuestions(allQuestions);
      const validQuestions = this.validateAndCleanQuestions(uniqueQuestions);
      
      console.log(`✅ Final result: ${validQuestions.length} unique, valid questions`);
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
      // Check if adding this line would exceed the limit
      if (currentChunk.length + line.length + 1 > maxSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If single line is too long, split it by sentences
        if (line.length > maxSize) {
          const sentences = line.split(/[.!?]+/);
          let tempLine = '';
          
          for (const sentence of sentences) {
            if (tempLine.length + sentence.length + 1 > maxSize) {
              if (tempLine.trim()) {
                chunks.push(tempLine.trim());
                tempLine = '';
              }
            }
            tempLine += (tempLine ? '. ' : '') + sentence;
          }
          
          if (tempLine.trim()) {
            currentChunk = tempLine.trim();
          }
        } else {
          currentChunk = line;
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
  }

  private async processTextChunk(text: string, chunkNumber: number): Promise<ExtractedQuestion[]> {
    try {
      const enhancedPrompt = this.createEnhancedPrompt(text);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
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
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error for chunk ${chunkNumber}:`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]) {
        console.log(`⚠️ No candidates generated for chunk ${chunkNumber}`);
        return [];
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        console.log(`⚠️ Content filtered by safety for chunk ${chunkNumber}`);
        return [];
      }

      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        console.log(`⚠️ No content generated for chunk ${chunkNumber}`);
        return [];
      }

      const generatedText = candidate.content.parts[0].text;
      console.log(`📝 Generated ${generatedText.length} characters for chunk ${chunkNumber}`);
      
      return this.parseAIResponse(generatedText, chunkNumber);
    } catch (error) {
      console.error(`❌ Failed to process chunk ${chunkNumber}:`, error);
      return [];
    }
  }

  private createEnhancedPrompt(text: string): string {
    return `
You are an expert at extracting JEE/NEET multiple choice questions from OCR text.
The text contains educational content that may have OCR errors and formatting issues.

OCR TEXT:
${text}

TASK: Extract ALL multiple choice questions following these strict requirements:

1. QUESTION FORMAT:
   - Must have exactly 4 options labeled (A), (B), (C), (D) or (1), (2), (3), (4)
   - Must have a clear question statement
   - Must identify the correct answer from the text or context

2. OCR ERROR CORRECTION:
   - Fix common mathematical symbols:
     * "∫" may appear as "f", "J", or "S"
     * "π" may appear as "n", "TT", or "II"  
     * "√" may appear as "V", "/", or "√"
     * "²" may appear as "2" or "^2"
     * "∆" may appear as "A", "△", or "delta"
     * "α", "β", "γ" may appear as "a", "b", "g"
   - Fix spacing issues in equations
   - Correct obvious typos in scientific terms

3. SUBJECT CLASSIFICATION:
   - Physics: mechanics, thermodynamics, optics, electricity, magnetism, waves, modern physics
   - Chemistry: organic, inorganic, physical chemistry, reactions, periodic table
   - Mathematics: algebra, calculus, geometry, trigonometry, statistics, coordinate geometry
   - Biology: botany, zoology, genetics, ecology, human physiology, cell biology

4. DIFFICULTY ESTIMATION:
   - easy: basic concepts, direct application, simple recall
   - medium: requires understanding and simple calculations, application of concepts
   - hard: complex problem-solving, multiple concepts, advanced calculations

5. CONFIDENCE SCORING:
   - Rate 0.0-1.0 based on how clear the question extraction was
   - Consider OCR quality, completeness, and clarity
   - Higher score for complete questions with clear options and answers

RETURN FORMAT (JSON Array):
[
  {
    "question_text": "What is the SI unit of electric current?",
    "option_a": "Ampere",
    "option_b": "Volt", 
    "option_c": "Ohm",
    "option_d": "Watt",
    "correct_answer": "A",
    "explanation": "The SI unit of electric current is Ampere (A), named after André-Marie Ampère",
    "subject": "Physics",
    "difficulty_level": "easy",
    "confidence_score": 0.95
  }
]

IMPORTANT RULES:
- Return ONLY valid JSON array, no other text
- If no questions found, return []
- Ensure all fields are present and valid
- Double-check correct_answer is exactly 'A', 'B', 'C', or 'D'
- Focus on complete questions with all 4 options clearly visible
- Skip incomplete or unclear questions
- If answer is not explicitly given, make educated guess based on content
- Maintain original mathematical notation where possible
`;
  }

  private parseAIResponse(text: string, chunkNumber: number): ExtractedQuestion[] {
    try {
      // Clean the response text
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*|\s*```/g, '');
      cleanedText = cleanedText.replace(/```\s*|\s*```/g, '');
      
      // Find JSON array in the text
      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        console.log(`⚠️ No valid JSON array found in chunk ${chunkNumber} response`);
        return [];
      }
      
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      
      // Try to parse JSON
      const questions = JSON.parse(cleanedText);
      
      if (!Array.isArray(questions)) {
        console.error(`❌ AI response is not an array for chunk ${chunkNumber}`);
        return [];
      }
      
      console.log(`📊 Parsed ${questions.length} questions from chunk ${chunkNumber}`);
      return questions;
    } catch (error) {
      console.error(`❌ Failed to parse AI response for chunk ${chunkNumber}:`, error);
      console.log('Raw response (first 500 chars):', text.substring(0, 500) + '...');
      
      // Try to extract questions manually as fallback
      return this.fallbackQuestionExtraction(text);
    }
  }

  private fallbackQuestionExtraction(text: string): ExtractedQuestion[] {
    // Simple fallback extraction - look for question patterns
    console.log('🔄 Attempting fallback question extraction...');
    
    const questions: ExtractedQuestion[] = [];
    const lines = text.split('\n');
    
    let currentQuestion: Partial<ExtractedQuestion> = {};
    let questionStarted = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for question patterns
      if (trimmedLine.includes('?') && trimmedLine.length > 20) {
        if (questionStarted && currentQuestion.question_text) {
          // Save previous question if complete
          if (this.isCompleteQuestion(currentQuestion)) {
            questions.push(this.completeQuestion(currentQuestion));
          }
        }
        
        currentQuestion = {
          question_text: trimmedLine,
          subject: 'Physics', // Default
          difficulty_level: 'medium',
          confidence_score: 0.5
        };
        questionStarted = true;
      }
      
      // Look for options
      if (questionStarted && /^[A-D][\.\)]\s*/.test(trimmedLine)) {
        const optionLetter = trimmedLine[0].toLowerCase();
        const optionText = trimmedLine.substring(2).trim();
        
        if (optionLetter === 'a') currentQuestion.option_a = optionText;
        else if (optionLetter === 'b') currentQuestion.option_b = optionText;
        else if (optionLetter === 'c') currentQuestion.option_c = optionText;
        else if (optionLetter === 'd') currentQuestion.option_d = optionText;
      }
    }
    
    // Add last question if complete
    if (questionStarted && this.isCompleteQuestion(currentQuestion)) {
      questions.push(this.completeQuestion(currentQuestion));
    }
    
    console.log(`📊 Fallback extraction found ${questions.length} questions`);
    return questions;
  }

  private isCompleteQuestion(q: Partial<ExtractedQuestion>): boolean {
    return !!(q.question_text && q.option_a && q.option_b && q.option_c && q.option_d);
  }

  private completeQuestion(q: Partial<ExtractedQuestion>): ExtractedQuestion {
    return {
      question_text: q.question_text || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer || 'A', // Default to A if not specified
      explanation: q.explanation,
      subject: q.subject || 'Physics',
      difficulty_level: q.difficulty_level || 'medium',
      confidence_score: q.confidence_score || 0.5
    };
  }

  private removeDuplicateQuestions(questions: ExtractedQuestion[]): ExtractedQuestion[] {
    const seen = new Set<string>();
    const uniqueQuestions: ExtractedQuestion[] = [];
    
    for (const question of questions) {
      // Create a normalized key for duplicate detection
      const key = question.question_text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim()
        .substring(0, 100); // Use first 100 chars for comparison
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueQuestions.push(question);
      } else {
        console.log('🔄 Removed duplicate question:', question.question_text.substring(0, 50) + '...');
      }
    }
    
    console.log(`📊 Removed ${questions.length - uniqueQuestions.length} duplicate questions`);
    return uniqueQuestions;
  }

  private validateAndCleanQuestions(questions: ExtractedQuestion[]): ExtractedQuestion[] {
    const validQuestions: ExtractedQuestion[] = [];
    
    for (const question of questions) {
      if (this.isValidQuestion(question)) {
        const cleanedQuestion = this.cleanQuestion(question);
        validQuestions.push(cleanedQuestion);
      } else {
        console.log('❌ Invalid question filtered out:', question.question_text?.substring(0, 50) + '...');
      }
    }
    
    console.log(`📊 Validated ${validQuestions.length}/${questions.length} questions`);
    return validQuestions;
  }

  private isValidQuestion(q: any): boolean {
    // Check if question object exists and has required structure
    if (!q || typeof q !== 'object') {
      return false;
    }

    // Check required string fields
    const requiredStringFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d'];
    for (const field of requiredStringFields) {
      if (!q[field] || typeof q[field] !== 'string' || q[field].trim().length < 2) {
        console.log(`❌ Invalid field ${field}:`, q[field]);
        return false;
      }
    }

    // Check question text length
    if (q.question_text.length < 10 || q.question_text.length > 1000) {
      console.log('❌ Question text length invalid:', q.question_text.length);
      return false;
    }

    // Check correct answer
    if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
      console.log('❌ Invalid correct_answer:', q.correct_answer);
      return false;
    }

    // Check subject
    if (!['Physics', 'Chemistry', 'Mathematics', 'Biology'].includes(q.subject)) {
      console.log('❌ Invalid subject:', q.subject);
      return false;
    }

    // Check difficulty level
    if (!['easy', 'medium', 'hard'].includes(q.difficulty_level)) {
      console.log('❌ Invalid difficulty_level:', q.difficulty_level);
      return false;
    }

    // Check confidence score
    if (typeof q.confidence_score !== 'number' || q.confidence_score < 0 || q.confidence_score > 1) {
      console.log('❌ Invalid confidence_score:', q.confidence_score);
      return false;
    }

    // Check for meaningful content (not just placeholder text)
    const questionLower = q.question_text.toLowerCase();
    const placeholderPatterns = [
      'example question',
      'sample question',
      'test question',
      'placeholder',
      'lorem ipsum'
    ];
    
    for (const pattern of placeholderPatterns) {
      if (questionLower.includes(pattern)) {
        console.log('❌ Placeholder question detected:', q.question_text.substring(0, 50));
        return false;
      }
    }

    // Check that options are different
    const options = [q.option_a, q.option_b, q.option_c, q.option_d];
    const uniqueOptions = new Set(options.map(opt => opt.toLowerCase().trim()));
    if (uniqueOptions.size < 4) {
      console.log('❌ Duplicate options detected');
      return false;
    }

    return true;
  }

  private cleanQuestion(q: any): ExtractedQuestion {
    return {
      question_text: this.cleanMathText(q.question_text),
      option_a: this.cleanMathText(q.option_a),
      option_b: this.cleanMathText(q.option_b),
      option_c: this.cleanMathText(q.option_c),
      option_d: this.cleanMathText(q.option_d),
      correct_answer: q.correct_answer.toUpperCase() as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation ? this.cleanMathText(q.explanation) : undefined,
      subject: q.subject as 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology',
      difficulty_level: q.difficulty_level as 'easy' | 'medium' | 'hard',
      confidence_score: Math.round(q.confidence_score * 100) / 100 // Round to 2 decimal places
    };
  }

  private cleanMathText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      // Fix common OCR errors for mathematical symbols
      .replace(/\bf\s*\(/g, '∫(')  // Fix integral symbol
      .replace(/\bTT\b/g, 'π')     // Fix pi symbol
      .replace(/\bII\b/g, 'π')     // Alternative pi fix
      .replace(/\bV\s*(\d)/g, '√$1') // Fix square root
      .replace(/\b(delta|Delta)\b/g, '∆') // Fix delta
      .replace(/\balpha\b/g, 'α')   // Fix alpha
      .replace(/\bbeta\b/g, 'β')    // Fix beta
      .replace(/\bgamma\b/g, 'γ')   // Fix gamma
      .replace(/\btheta\b/g, 'θ')   // Fix theta
      .replace(/\bomega\b/g, 'ω')   // Fix omega
      .replace(/\bsigma\b/g, 'σ')   // Fix sigma
      .replace(/\blambda\b/g, 'λ')  // Fix lambda
      
      // Fix common formatting issues
      .replace(/\s*\^\s*(\d+)/g, '^$1') // Fix exponents
      .replace(/\s*_\s*(\d+)/g, '_$1')  // Fix subscripts
      .replace(/\s+/g, ' ')             // Normalize whitespace
      .replace(/\s*([+\-*/=])\s*/g, ' $1 ') // Space around operators
      
      // Clean up extra spaces and punctuation
      .replace(/\s*,\s*/g, ', ')        // Fix comma spacing
      .replace(/\s*\.\s*/g, '. ')       // Fix period spacing
      .replace(/\s*:\s*/g, ': ')        // Fix colon spacing
      .replace(/\s*;\s*/g, '; ')        // Fix semicolon spacing
      
      .trim();
  }

  // Public method to get extraction statistics
  public getExtractionStats(questions: ExtractedQuestion[]): {
    total: number;
    bySubject: Record<string, number>;
    byDifficulty: Record<string, number>;
    averageConfidence: number;
  } {
    const stats = {
      total: questions.length,
      bySubject: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      averageConfidence: 0
    };

    // Count by subject
    for (const question of questions) {
      stats.bySubject[question.subject] = (stats.bySubject[question.subject] || 0) + 1;
      stats.byDifficulty[question.difficulty_level] = (stats.byDifficulty[question.difficulty_level] || 0) + 1;
    }

    // Calculate average confidence
    if (questions.length > 0) {
      const totalConfidence = questions.reduce((sum, q) => sum + q.confidence_score, 0);
      stats.averageConfidence = Math.round((totalConfidence / questions.length) * 100) / 100;
    }

    return stats;
  }
}