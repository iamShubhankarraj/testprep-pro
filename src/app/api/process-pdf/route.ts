import { NextRequest, NextResponse } from 'next/server';
import { PDFQuestionProcessor } from '@/lib/pdf-question-processor';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PDF processing API endpoint called');

    // Get the uploaded file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const pdfId = formData.get('pdfId') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Initialize the PDF processor
    const processor = new PDFQuestionProcessor();

    // Validate PDF before processing
    const validation = await processor.validatePDF(pdfBuffer);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    console.log(`✅ PDF validation passed: ${validation.estimatedPages} estimated pages`);

    // Process the PDF
    const result = await processor.processPDF(pdfBuffer, pdfId, userId);

    if (result.success) {
      console.log(`🎉 Processing completed: ${result.questionsExtracted} questions extracted`);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          questionsExtracted: result.questionsExtracted,
          questionsStored: result.questionsStored,
          processingTime: result.processingTime,
          pdfId: pdfId
        }
      });
    } else {
      console.error(`❌ Processing failed: ${result.message}`);
      
      return NextResponse.json({
        success: false,
        error: result.message,
        details: result.errorDetails
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ API endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfId = searchParams.get('pdfId');
    const userId = searchParams.get('userId');

    if (!pdfId || !userId) {
      return NextResponse.json(
        { error: 'PDF ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get PDF status from database
    const { data: pdf, error } = await supabase
      .from('pdfs')
      .select('processing_status, total_questions, created_at, updated_at')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (error || !pdf) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    // Get questions count if completed
    let questionsCount = 0;
    if (pdf.processing_status === 'completed') {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('pdf_id', pdfId)
        .eq('user_id', userId);
      
      questionsCount = count || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        status: pdf.processing_status,
        totalQuestions: pdf.total_questions || questionsCount,
        createdAt: pdf.created_at,
        updatedAt: pdf.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check status'
    }, { status: 500 });
  }
}