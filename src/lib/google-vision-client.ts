import * as fs from 'fs';
import * as path from 'path';
import type { PDFPage } from './pdf-to-images';

export interface OCRResult {
  text: string;
  confidence: number;
  pageNumber: number;
  wordCount: number;
}

export class GoogleVisionClient {
  private apiKey: string;

  constructor() {
    // Prefer environment variable (works on Vercel). Fallback to .env.local for local dev.
    const envApiKey = process.env.GOOGLE_VISION_API_KEY;
    if (envApiKey && envApiKey.trim() !== '') {
      this.apiKey = envApiKey.trim();
      console.log('✅ Google Vision API key loaded from environment');
      return;
    }

    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars: Record<string, string> = {};
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });
      const fileKey = envVars['GOOGLE_VISION_API_KEY'];
      if (fileKey && fileKey.trim() !== '') {
        this.apiKey = fileKey.trim();
        console.log('✅ Google Vision API key loaded from .env.local');
        return;
      }
    }

    throw new Error('GOOGLE_VISION_API_KEY not found. Set it in environment variables (e.g., Vercel Project Settings) or in a local .env.local for development.');
  }

  async processImage(imageBuffer: Buffer, pageNumber: number): Promise<OCRResult> {
    try {
      console.log(`🔍 Processing page ${pageNumber} with Google Vision...`);

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 50
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.responses || !data.responses[0]) {
        console.log(`⚠️ No response for page ${pageNumber}`);
        return {
          text: '',
          confidence: 0,
          pageNumber,
          wordCount: 0
        };
      }

      const responseData = data.responses[0];

      if (responseData.error) {
        throw new Error(`API error: ${responseData.error.message}`);
      }

      if (!responseData.textAnnotations || responseData.textAnnotations.length === 0) {
        console.log(`⚠️ No text detected on page ${pageNumber}`);
        return {
          text: '',
          confidence: 0,
          pageNumber,
          wordCount: 0
        };
      }

      // First annotation contains the full text
      const fullText = responseData.textAnnotations[0].description || '';
      
      // Calculate average confidence from word-level detections
      const wordDetections = responseData.textAnnotations.slice(1);
      const avgConfidence = wordDetections.length > 0 
        ? wordDetections.reduce((sum: number, detection: any) => sum + (detection.confidence || 0.8), 0) / wordDetections.length
        : 0.8; // Default confidence if no word-level data

      const wordCount = fullText.split(/\s+/).filter((word: string) => word.length > 0).length;

      console.log(`✅ Page ${pageNumber}: ${fullText.length} chars, ${wordCount} words, ${(avgConfidence * 100).toFixed(1)}% confidence`);

      return {
        text: fullText,
        confidence: avgConfidence,
        pageNumber,
        wordCount
      };
    } catch (error) {
      console.error(`❌ OCR failed for page ${pageNumber}:`, error);
      return {
        text: '',
        confidence: 0,
        pageNumber,
        wordCount: 0
      };
    }
  }

  async processPDFPages(pages: PDFPage[]): Promise<string> {
    try {
      console.log(`🚀 Processing ${pages.length} pages with Google Vision OCR...`);

      if (pages.length === 0) {
        throw new Error('No pages to process');
      }

      // Process pages in batches to respect rate limits
      const batchSize = 3;
      const results: OCRResult[] = [];

      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pages.length/batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(page => this.processImage(page.imageBuffer, page.pageNumber))
        );
        results.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < pages.length) {
          console.log('⏳ Waiting 1 second before next batch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Filter and combine results
      const validResults = results.filter(result => 
        result.confidence > 0.3 && 
        result.text.length > 20 &&
        result.wordCount > 5
      );

      console.log(`📊 OCR Results: ${validResults.length}/${results.length} pages with good quality text`);

      if (validResults.length === 0) {
        throw new Error('No readable text found in PDF. The document may be too blurry or contain only images.');
      }

      // Combine all pages into one text
      const combinedText = validResults
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map(result => `--- PAGE ${result.pageNumber} (${result.wordCount} words, ${(result.confidence * 100).toFixed(1)}% confidence) ---\n${result.text}`)
        .join('\n\n');

      const totalWords = validResults.reduce((sum, result) => sum + result.wordCount, 0);
      const avgConfidence = validResults.reduce((sum, result) => sum + result.confidence, 0) / validResults.length;

      console.log(`✅ OCR completed: ${combinedText.length} characters, ${totalWords} words, ${(avgConfidence * 100).toFixed(1)}% avg confidence`);
      
      return combinedText;
    } catch (error) {
      console.error('❌ PDF OCR processing failed:', error);
      throw new Error(`Failed to process PDF with OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}