import { supabase } from './supabase';
import type { ExtractedQuestion } from './enhanced-question-extractor';

export interface StoredQuestion {
  id: string;
  pdf_id: string;
  user_id: string;
  subject_id: number | null;
  topic_id: number | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  difficulty_level: 'easy' | 'medium' | 'hard';
  question_type: 'mcq' | 'numerical';
  created_at: string;
}

export class QuestionStorage {
  private subjectMap: Map<string, number> = new Map();

  constructor() {
    this.initializeSubjectMap();
  }

  private async initializeSubjectMap() {
    try {
      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('id, name');

      if (error) {
        console.error('Failed to fetch subjects:', error);
        this.subjectMap.set('Physics', 1);
        this.subjectMap.set('Chemistry', 2);
        this.subjectMap.set('Mathematics', 3);
        this.subjectMap.set('Biology', 4);
      } else if (subjects) {
        subjects.forEach(subject => {
          this.subjectMap.set(subject.name, subject.id);
        });
        console.log('Subject mapping initialized:', Array.from(this.subjectMap.entries()));
      }
    } catch (error) {
      console.error('Error initializing subject map:', error);
      this.subjectMap.set('Physics', 1);
      this.subjectMap.set('Chemistry', 2);
      this.subjectMap.set('Mathematics', 3);
      this.subjectMap.set('Biology', 4);
    }
  }

  async storeQuestions(
    questions: ExtractedQuestion[], 
    pdfId: string, 
    userId: string
  ): Promise<{ 
    success: number; 
    failed: number; 
    storedQuestions: StoredQuestion[] 
  }> {
    let success = 0;
    let failed = 0;
    const storedQuestions: StoredQuestion[] = [];

    if (this.subjectMap.size === 0) {
      await this.initializeSubjectMap();
    }

    console.log(`Storing ${questions.length} questions to database...`);

    const batchSize = 10;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questions.length/batchSize)}`);
      
      const batchPromises = batch.map(async (question) => {
        try {
          const questionData = {
            pdf_id: pdfId,
            user_id: userId,
            subject_id: this.subjectMap.get(question.subject) || null,
            topic_id: null,
            question_text: question.question_text,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_answer: question.correct_answer,
            explanation: question.explanation || null,
            difficulty_level: question.difficulty_level,
            question_type: 'mcq' as const
          };

          const { data, error } = await supabase
            .from('questions')
            .insert(questionData)
            .select()
            .single();

          if (error) {
            console.error('Failed to store question:', error);
            failed++;
            return null;
          } else if (data) {
            success++;
            storedQuestions.push(data as StoredQuestion);
            return data;
          }
        } catch (error) {
          console.error('Question storage error:', error);
          failed++;
          return null;
        }
      });

      await Promise.all(batchPromises);
      
      if (i + batchSize < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Storage complete: ${success} succeeded, ${failed} failed`);
    return { success, failed, storedQuestions };
  }

  async updatePDFProcessingStatus(
    pdfId: string, 
    status: 'processing' | 'completed' | 'failed',
    totalQuestions?: number,
    extractedText?: string
  ) {
    try {
      const updateData: any = { 
        processing_status: status
      };
      
      if (totalQuestions !== undefined) {
        updateData.total_questions = totalQuestions;
      }
      
      if (extractedText !== undefined) {
        updateData.extracted_text = extractedText;
      }

      const { error } = await supabase
        .from('pdfs')
        .update(updateData)
        .eq('id', pdfId);

      if (error) {
        console.error('Failed to update PDF status:', error);
        throw error;
      }

      console.log(`Updated PDF ${pdfId} status to: ${status}`);
    } catch (error) {
      console.error('Error updating PDF status:', error);
      throw error;
    }
  }

  async getPDFQuestions(pdfId: string): Promise<StoredQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('pdf_id', pdfId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch PDF questions:', error);
        throw error;
      }

      return data as StoredQuestion[];
    } catch (error) {
      console.error('Error fetching PDF questions:', error);
      throw error;
    }
  }

  async getQuestionStats(userId: string): Promise<{
    total: number;
    bySubject: Record<string, number>;
    byDifficulty: Record<string, number>;
    byPDF: Record<string, number>;
  }> {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('subject_id, difficulty_level, pdf_id, subjects(name), pdfs(title)')
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to fetch question stats:', error);
        throw error;
      }

      const stats = {
        total: questions?.length || 0,
        bySubject: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
        byPDF: {} as Record<string, number>
      };

      questions?.forEach((q: any) => {
        const subjectName = q.subjects?.name || 'Unknown';
        stats.bySubject[subjectName] = (stats.bySubject[subjectName] || 0) + 1;

        stats.byDifficulty[q.difficulty_level] = (stats.byDifficulty[q.difficulty_level] || 0) + 1;

        const pdfTitle = q.pdfs?.title || 'Unknown PDF';
        stats.byPDF[pdfTitle] = (stats.byPDF[pdfTitle] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting question stats:', error);
      throw error;
    }
  }
}
