import { fromBuffer } from 'pdf2pic';
// import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

// Use require for sharp to avoid esModuleInterop issues
const sharp = require('sharp');

export interface PDFPage {
  pageNumber: number;
  imageBuffer: Buffer;
  imagePath: string;
  confidence?: number;
}

export class PDFToImageConverter {
  private tempDir: string;

  constructor() {
    this.tempDir = join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('📁 Temp directory ready:', this.tempDir);
    } catch (error) {
      console.error('Failed to create temp directory:', error);
      throw new Error('Failed to create temporary directory');
    }
  }

  async convertPDFToImages(pdfBuffer: Buffer): Promise<PDFPage[]> {
    try {
      console.log('🔄 Converting PDF to high-quality images...');
      console.log(`📄 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      const convert = fromBuffer(pdfBuffer, {
        density: 300,
        saveFilename: "page",
        savePath: this.tempDir,
        format: "png",
        width: 2000,
        height: 2000
      });

      const results = await convert.bulk(-1);
      console.log(`📄 Successfully converted ${results.length} pages`);

      if (results.length === 0) {
        throw new Error('No pages found in PDF or conversion failed');
      }

      const pages: PDFPage[] = [];
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (!result.path) {
          console.error(`❌ No path found for page ${i + 1}`);
          continue;
        }

        try {
          const enhancedBuffer = await this.enhanceImageForOCR(result.path);
          
          pages.push({
            pageNumber: i + 1,
            imageBuffer: enhancedBuffer,
            imagePath: result.path
          });
        } catch (error) {
          console.error(`❌ Failed to process page ${i + 1}:`, error);
        }
      }

      if (pages.length === 0) {
        throw new Error('No pages could be processed successfully');
      }

      console.log(`✅ Enhanced ${pages.length} pages for OCR processing`);
      return pages;
    } catch (error) {
      console.error('❌ PDF to image conversion failed:', error);
      throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async enhanceImageForOCR(imagePath: string): Promise<Buffer> {
    try {
      return await sharp(imagePath)
        .resize(2000, 2000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .modulate({
          brightness: 1.1,
          contrast: 1.2
        })
        .grayscale()        // Convert to grayscale
        .normalize()        // Improve contrast automatically
        .sharpen(1)         // Apply a moderate sharpen
        .toBuffer();
    } catch (error) {
      console.error('Image enhancement failed for:', imagePath, error);
      try {
        return await fs.readFile(imagePath);
      } catch (readError) {
        console.error('Failed to read original image:', readError);
        throw new Error('Failed to process image');
      }
    }
  }

  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files.map(file => 
          fs.unlink(join(this.tempDir, file)).catch(() => {})
        )
      );
      console.log('🧹 Temporary files cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

