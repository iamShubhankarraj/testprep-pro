import { PDFToImageConverter } from './pdf-to-images';
import { GoogleVisionClient } from './google-vision-client';
import { EnhancedQuestionExtractor } from './enhanced-question-extractor';
import { QuestionStorage } from './question-storage';
import type { ExtractedQuestion } from './enhanced-question-extractor';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessingResult {
  success: boolean;
  questionsExtracted: number;
  questionsStored: number;
  message: string;
  extractedQuestions?: ExtractedQuestion[];
  processingTime: number;
  errorDetails?: string;
}

export class PDFQuestionProcessor {
  private pdfConverter: PDFToImageConverter;
  private visionClient: GoogleVisionClient;
  private questionExtractor: EnhancedQuestionExtractor;
  private questionStorage: QuestionStorage;

  constructor() {
    this.pdfConverter = new PDFToImageConverter();
    this.visionClient = new GoogleVisionClient();
    this.questionExtractor = new EnhancedQuestionExtractor();
    this.questionStorage = new QuestionStorage();
  }

  async processPDF(
    pdfBuffer: Buffer,
    pdfId: string,
    userId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log('🚀 Starting PDF processing pipeline...');
      console.log(`📄 Processing PDF ID: ${pdfId} for user: ${userId}`);

      // Update status to processing
      await this.questionStorage.updatePDFProcessingStatus(pdfId, 'processing');

      // Step 1: Convert PDF to images
      console.log('📄 Step 1: Converting PDF to images...');
      const pages = await this.pdfConverter.convertPDFToImages(pdfBuffer);
      console.log(`✅ Converted ${pages.length} pages to images`);

      if (pages.length === 0) {
        throw new Error('No pages could be extracted from the PDF');
      }

      // Step 2: Extract text using Google Vision OCR
      console.log('👁 Step 2: Extracting text with Google Vision OCR...');
      const extractedText = await this.visionClient.processPDFPages(pages);
      console.log(`✅ Extracted ${extractedText.length} characters of text`);

      if (extractedText.length < 100) {
        throw new Error('Insufficient text extracted from PDF. The document may be mostly images or poor quality.');
      }

      // Step 3: Extract questions using AI
      console.log('🤖 Step 3: Extracting questions with AI...');
      const extractedQuestions = await this.questionExtractor.extractQuestions(extractedText);
      console.log(`✅ Extracted ${extractedQuestions.length} questions`);

      // Step 4: Handle case where no questions are found
      if (extractedQuestions.length === 0) {
        await this.questionStorage.updatePDFProcessingStatus(
          pdfId,
          'completed',
          0,
          extractedText.substring(0, 5000)
        );

        const processingTime = Date.now() - startTime;
        return {
          success: true,
          questionsExtracted: 0,
          questionsStored: 0,
          message: 'PDF processed successfully, but no multiple choice questions were found. The document may not contain MCQs in the expected format.',
          processingTime
        };
      }

      // Step 5: Store questions in database
      console.log('💾 Step 5: Storing questions in database...');
      const storageResult = await this.questionStorage.storeQuestions(
        extractedQuestions,
        pdfId,
        userId
      );
      console.log(`✅ Stored ${storageResult.success} questions successfully`);

      if (storageResult.failed > 0) {
        console.log(`⚠ Failed to store ${storageResult.failed} questions`);
      }

      // Step 6: Update PDF status
      await this.questionStorage.updatePDFProcessingStatus(
        pdfId,
        'completed',
        storageResult.success,
        extractedText.substring(0, 5000)
      );

      // Step 7: Cleanup temporary files
      await this.pdfConverter.cleanup();

      const processingTime = Date.now() - startTime;
      console.log(`🎉 PDF processing completed in ${(processingTime / 1000).toFixed(2)} seconds`);

      return {
        success: true,
        questionsExtracted: extractedQuestions.length,
        questionsStored: storageResult.success,
        message: `Successfully processed PDF! Extracted ${extractedQuestions.length} questions and stored ${storageResult.success} in the database.${storageResult.failed > 0 ? ` ${storageResult.failed} questions failed to store.` : ''}`,
        extractedQuestions,
        processingTime
      };

    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Update PDF status to failed
      try {
        await this.questionStorage.updatePDFProcessingStatus(pdfId, 'failed');
      } catch (statusError) {
        console.error('Failed to update PDF status:', statusError);
      }

      // Cleanup on error
      try {
        await this.pdfConverter.cleanup();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }

      const processingTime = Date.now() - startTime;
      return {
        success: false,
        questionsExtracted: 0,
        questionsStored: 0,
        message: `PDF processing failed: ${errorMessage}`,
        errorDetails: errorMessage,
        processingTime
      };
    }
  }

  // Validate PDF before processing
  async validatePDF(pdfBuffer: Buffer): Promise<{
    isValid: boolean;
    message: string;
    fileSize: number;
    estimatedPages: number;
  }> {
    try {
      const fileSize = pdfBuffer.length;
      const fileSizeMB = fileSize / (1024 * 1024);

      // Basic validation
      if (fileSize < 1024) {
        return {
          isValid: false,
          message: 'PDF file is too small (less than 1KB)',
          fileSize,
          estimatedPages: 0
        };
      }

      if (fileSizeMB > 50) {
        return {
          isValid: false,
          message: 'PDF file is too large (over 50MB)',
          fileSize,
          estimatedPages: 0
        };
      }

      // Check if it's actually a PDF
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        return {
          isValid: false,
          message: 'File is not a valid PDF',
          fileSize,
          estimatedPages: 0
        };
      }

      // Rough estimation of pages (very approximate)
      const estimatedPages = Math.max(1, Math.floor(fileSizeMB * 2));

      return {
        isValid: true,
        message: 'PDF is valid and ready for processing',
        fileSize,
        estimatedPages
      };

    } catch (error) {
      return {
        isValid: false,
        message: `PDF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fileSize: pdfBuffer.length,
        estimatedPages: 0
      };
    }
  }

  // Get processing statistics for a user
  async getUserProcessingStats(userId: string): Promise<{
    totalPDFsProcessed: number;
    totalQuestionsExtracted: number;
    successRate: number;
    averageQuestionsPerPDF: number;
    subjectBreakdown: Record<string, number>;
  }> {
    try {
      const stats = await this.questionStorage.getQuestionStats(userId);
      
      return {
        totalPDFsProcessed: Object.keys(stats.byPDF).length,
        totalQuestionsExtracted: stats.total,
        successRate: 100, // Would need additional tracking for this
        averageQuestionsPerPDF: stats.total / Math.max(Object.keys(stats.byPDF).length, 1),
        subjectBreakdown: stats.bySubject
      };
    } catch (error) {
      console.error('Error getting user processing stats:', error);
      return {
        totalPDFsProcessed: 0,
        totalQuestionsExtracted: 0,
        successRate: 0,
        averageQuestionsPerPDF: 0,
        subjectBreakdown: {}
      };
    }
  }
}