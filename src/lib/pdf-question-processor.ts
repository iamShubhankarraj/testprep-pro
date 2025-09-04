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

      await this.questionStorage.updatePDFProcessingStatus(pdfId, 'processing');

      console.log('📄 Step 1: Converting PDF to images...');
      const pages = await this.pdfConverter.convertPDFToImages(pdfBuffer);
      console.log(`✅ Converted ${pages.length} pages to images`);
      if (pages.length === 0) throw new Error('No pages could be extracted from the PDF');

      console.log('👁 Step 2: Extracting text with Google Vision OCR (page by page)...');
      const ocrPromises = pages.map(page => this.visionClient.processImage(page.imageBuffer, page.pageNumber));
      const ocrResults = await Promise.all(ocrPromises);
      
      const validOcrResults = ocrResults.filter(result => result.confidence > 0.3 && result.wordCount > 5);
      console.log(`✅ Extracted text from ${validOcrResults.length}/${pages.length} pages`);
      if (validOcrResults.length === 0) throw new Error('Insufficient text extracted from PDF.');

      console.log('🤖 Step 3: Extracting questions with AI (page by page)...');
      const questionExtractionPromises = validOcrResults.map(ocrResult => 
        this.questionExtractor.extractQuestions(ocrResult.text, ocrResult.pageNumber)
      );
      const questionsFromAllPages = await Promise.all(questionExtractionPromises);
      const extractedQuestions = questionsFromAllPages.flat();
      console.log(`✅ Extracted a total of ${extractedQuestions.length} questions`);

      if (extractedQuestions.length === 0) {
        const combinedText = validOcrResults.map(r => r.text).join('\n');
        await this.questionStorage.updatePDFProcessingStatus(pdfId, 'completed', 0, combinedText.substring(0, 5000));
        const processingTime = Date.now() - startTime;
        return {
          success: true,
          questionsExtracted: 0,
          questionsStored: 0,
          message: 'PDF processed successfully, but no multiple choice questions were found.',
          processingTime
        };
      }

      console.log('💾 Step 4: Storing questions in database...');
      const storageResult = await this.questionStorage.storeQuestions(extractedQuestions, pdfId, userId);
      console.log(`✅ Stored ${storageResult.success} questions successfully`);
      if (storageResult.failed > 0) console.log(`⚠ Failed to store ${storageResult.failed} questions`);

      await this.questionStorage.updatePDFProcessingStatus(pdfId, 'completed', storageResult.success);

      await this.pdfConverter.cleanup();

      const processingTime = Date.now() - startTime;
      console.log(`🎉 PDF processing completed in ${(processingTime / 1000).toFixed(2)} seconds`);

      return {
        success: true,
        questionsExtracted: extractedQuestions.length,
        questionsStored: storageResult.success,
        message: `Successfully processed PDF! Extracted ${extractedQuestions.length} questions and stored ${storageResult.success}.`,
        extractedQuestions,
        processingTime
      };

    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      try {
        await this.questionStorage.updatePDFProcessingStatus(pdfId, 'failed');
      } catch (statusError) {
        console.error('Failed to update PDF status:', statusError);
      }
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

  async validatePDF(pdfBuffer: Buffer): Promise<{
    isValid: boolean;
    message: string;
    fileSize: number;
    estimatedPages: number;
  }> {
    try {
      const fileSize = pdfBuffer.length;
      const fileSizeMB = fileSize / (1024 * 1024);

      if (fileSize < 1024) return { isValid: false, message: 'PDF file is too small (< 1KB)', fileSize, estimatedPages: 0 };
      if (fileSizeMB > 50) return { isValid: false, message: 'PDF file is too large (> 50MB)', fileSize, estimatedPages: 0 };
      
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') return { isValid: false, message: 'File is not a valid PDF', fileSize, estimatedPages: 0 };
      
      const estimatedPages = Math.max(1, Math.floor(fileSizeMB * 2));
      return { isValid: true, message: 'PDF is valid', fileSize, estimatedPages };
    } catch (error) {
      return { isValid: false, message: `PDF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, fileSize: pdfBuffer.length, estimatedPages: 0 };
    }
  }

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
        successRate: 100,
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

