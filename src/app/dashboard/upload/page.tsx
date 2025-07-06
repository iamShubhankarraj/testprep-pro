'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle, XCircle, Trash2, Brain, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Play, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'


export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [questionsExtracted, setQuestionsExtracted] = useState<number | null>(null)
  const [showTestForm, setShowTestForm] = useState(false)
const [extractedPdfId, setExtractedPdfId] = useState<string | null>(null)
const [testTitle, setTestTitle] = useState('')
const [testDuration, setTestDuration] = useState(180)
const [testDescription, setTestDescription] = useState('')
const [creatingTest, setCreatingTest] = useState(false)
const [createdTestId, setCreatedTestId] = useState<string | null>(null)
const router = useRouter()

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        setUploadSuccess(null)
        setMessage('')
        setQuestionsExtracted(null)
      } else {
        setSelectedFile(null)
        setUploadSuccess(false)
        setMessage('Please select a PDF file.')
      }
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files)
  }, [])

  const handleCreateTest = async () => {
    if (!extractedPdfId || !questionsExtracted || !testTitle.trim()) {
      setMessage('Please fill all test details.');
      return;
    }
    setCreatingTest(true)
    setMessage('Creating test and linking questions...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      // Step 1: Create the test
      console.log('Test insert data:', {
        user_id: user.id,
        title: testTitle.trim(),
        description: testDescription.trim() || null,
        total_questions: questionsExtracted,
        duration_minutes: testDuration,
        difficulty_level: 'mixed',
        test_type: 'practice',
        subjects: null,
        is_active: true
      });
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{
          user_id: user.id,
          title: testTitle.trim(),
          description: testDescription.trim() || null,
          total_questions: questionsExtracted,
          duration_minutes: testDuration,
          difficulty_level: 'mixed',
          test_type: 'practice',
          subjects: null,
          is_active: true
        }])
        .select()
        .single()
      if (testError) throw testError
      setMessage('✅ Test created! Linking questions...')
      // Step 2: Get questions from the PDF
      const { data: pdfQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('pdf_id', extractedPdfId)
        .eq('user_id', user.id)
        .limit(questionsExtracted)
      if (questionsError || !pdfQuestions || pdfQuestions.length === 0) {
        throw new Error('Failed to fetch questions from PDF')
      }
      // Step 3: Link questions to test
      const testQuestionLinks = pdfQuestions.map((question, index) => ({
        test_id: testData.id,
        question_id: question.id,
        question_order: index + 1
      }))
      const { error: linkError } = await supabase
        .from('test_questions')
        .insert(testQuestionLinks)
      if (linkError) throw linkError
      setMessage('🎉 Test created successfully!')
      setCreatedTestId(testData.id)
      setShowTestForm(false)
    } catch (error) {
      console.error('Error creating test:', error, JSON.stringify(error));
      setMessage(`❌ Failed to create test: ${
        error && typeof error === 'object' && 'message' in error
          ? error.message
          : JSON.stringify(error) || 'Unknown error'
      }`);
    } finally {
      setCreatingTest(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.')
      return
    }

    setUploading(true)
    setUploadSuccess(null)
    setMessage('')
    setQuestionsExtracted(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated. Please log in.')
      }

      // Step 1: Upload to Supabase Storage
      setMessage('Uploading PDF to storage...')
      const storagePath = `user_uploads/${user.id}/${Date.now()}-${selectedFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Step 2: Save PDF metadata to database
      const { data: pdfData, error: dbError } = await supabase
  .from('pdfs')
  .insert([
    {
      user_id: user.id,
      file_name: selectedFile.name,
      file_url: uploadData.path,  // ← Changed to file_url
      title: selectedFile.name.split('.').slice(0, -1).join('.'),
      file_size: selectedFile.size,
      processing_status: 'pending',
    },
  ])
        .select()
        .single()

      if (dbError) {
        console.error('Error saving PDF metadata to DB, attempting to remove file from storage:', dbError);
        await supabase.storage.from('study-materials').remove([uploadData.path]);
        throw dbError;
      }

      setUploading(false)
      setProcessing(true)
      setMessage('PDF uploaded successfully! Now extracting questions with AI...')

      // Step 3: Process PDF with our API
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('userId', user.id)
      formData.append('pdfId', pdfData.id)

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData
      })
      
      console.log('API Response status:', response.status)
      console.log('API Response headers:', response.headers)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('API Error response:', errorText)
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setUploadSuccess(true)
        setQuestionsExtracted(result.data.questionsExtracted)
        setExtractedPdfId(result.data.pdfId)
        setTestTitle(selectedFile.name.replace('.pdf', '') + ' Test')
        setTestDescription(`Test created from ${selectedFile.name} with ${result.data.questionsExtracted} questions`)
        setMessage(`🎉 Success! Extracted ${result.data.questionsExtracted} questions! Now configure your test below.`)
        setShowTestForm(true)
      } else {
        throw new Error(result.error || 'Processing failed')
      }
      
      setSelectedFile(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadSuccess(false)
      setMessage(`Upload failed: ${errorMessage}`)
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-4xl mx-auto py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Upload Your Study Material
            </h1>
            <p className="text-lg text-gray-300">
              Transform your PDFs into powerful test-generating resources with AI.
            </p>
          </div>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl px-5 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl p-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-3xl font-bold">AI-Powered PDF Processor</CardTitle>
            <p className="text-gray-300 text-md">Upload your PDFs and let AI extract questions automatically.</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div
              className={`border-4 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ease-in-out
                ${isDragging ? 'border-purple-500 bg-purple-900/30 shadow-purple-500/50 scale-105' : 'border-blue-500/50 bg-slate-800/50'}
                hover:border-blue-400 hover:bg-slate-700/50 hover:shadow-lg
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
                id="file-upload-input"
              />
              <Upload className="w-16 h-16 text-blue-400 mx-auto mb-6 animate-bounce-slow" />
              <p className="text-white/90 text-xl font-semibold mb-4">
                Drag & Drop your PDF here, or
              </p>
              <label htmlFor="file-upload-input">
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <span>
                    <FileText className="w-5 h-5 mr-2" />
                    Browse Files
                  </span>
                </Button>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-5 bg-white/15 rounded-xl border border-white/20 shadow-md animate-fade-in">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-purple-400 mr-3" />
                  <span className="text-white text-lg font-medium truncate max-w-xs">{selectedFile.name}</span>
                  <span className="text-gray-400 text-sm ml-3">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:bg-red-500/20 rounded-full"
                  title="Remove file"
                  disabled={uploading || processing}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            )}

            {message && (
              <div
                className={`flex items-center p-4 rounded-xl shadow-md animate-fade-in ${
                  uploadSuccess ? 'bg-green-500/20 text-green-300 border border-green-400' : 'bg-red-500/20 text-red-300 border border-red-400'
                }`}
              >
                {uploadSuccess ? (
                  <CheckCircle className="w-6 h-6 mr-3" />
                ) : (
                  <XCircle className="w-6 h-6 mr-3" />
                )}
                <p className="text-lg font-medium">{message}</p>
              </div>
            )}

            {questionsExtracted !== null && questionsExtracted > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-500/20 text-blue-300 border border-blue-400 rounded-xl">
                <div className="flex items-center">
                  <Brain className="w-6 h-6 mr-3" />
                  <span className="text-lg font-medium">{questionsExtracted} questions extracted and ready!</span>
                </div>
                <Link href="/test/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    Create Test
                  </Button>
                </Link>
              </div>
            )}

            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading || processing}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-4 px-6 rounded-xl text-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Uploading PDF...
                </>
              ) : processing ? (
                <>
                  <Brain className="w-6 h-6 mr-3 animate-pulse" />
                  AI Processing Questions...
                </>
              ) : (
                'Upload & Process with AI'
              )}
            </Button>
            {/* Test Creation Form - Show after questions are extracted */}
{showTestForm && questionsExtracted && (
  <div className="mt-8 p-6 bg-blue-500/10 border border-blue-400/30 rounded-xl">
    <h3 className="text-white text-xl font-bold mb-4 flex items-center">
      <Brain className="w-6 h-6 mr-2" />
      Configure Your Test
    </h3>
    <p className="text-gray-300 mb-6">
      {questionsExtracted} questions extracted successfully! Configure your test details below.
    </p>
    
    <div className="space-y-4">
      {/* Test Title */}
      <div>
        <Label htmlFor="test-title" className="text-white text-sm mb-2 block">Test Title</Label>
        <Input
          id="test-title"
          type="text"
          value={testTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestTitle(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
          placeholder="Enter test title"
        />
      </div>

      {/* Test Description */}
      <div>
        <Label htmlFor="test-description" className="text-white text-sm mb-2 block">Description (Optional)</Label>
        <Textarea
          id="test-description"
          value={testDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestDescription(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3 min-h-[80px]"
          placeholder="Brief description of the test"
        />
      </div>

      {/* Duration and Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="test-duration" className="text-white text-sm mb-2 block">Duration (Minutes)</Label>
          <Input
            id="test-duration"
            type="number"
            value={testDuration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDuration(parseInt(e.target.value) || 180)}
            min="30"
            max="300"
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
          />
        </div>
        <div>
          <Label className="text-white text-sm mb-2 block">Questions Available</Label>
          <div className="bg-white/5 border border-white/20 rounded-lg p-3 text-white">
            {questionsExtracted} questions
          </div>
        </div>
      </div>

      {/* Create Test Button */}
      <Button
        onClick={handleCreateTest}
        disabled={creatingTest || !testTitle.trim()}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl text-lg font-bold transition-all duration-300 disabled:opacity-50"
      >
        {creatingTest ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Creating Test...
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Test
          </>
        )}
      </Button>
    </div>
  </div>
)}
   {/* Test Action Options - Show after test is created */}
{createdTestId && (
  <div className="mt-8 p-6 bg-green-500/10 border border-green-400/30 rounded-xl text-center">
    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
    <h3 className="text-white text-xl font-bold mb-2">Test Created Successfully!</h3>
    <p className="text-gray-300 mb-6">
      Your test "{testTitle}" is ready with {questionsExtracted} questions.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        onClick={() => router.push(`/test/${createdTestId}/start`)}
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        <Play className="w-5 h-5 mr-2" />
        Take Test Now
      </Button>
      
      <Button
        onClick={() => router.push('/dashboard/tests')}
        variant="outline"
        className="border-white/30 text-white hover:bg-white/20 hover:text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg"
      >
        <BookOpen className="w-5 h-5 mr-2" />
        Save for Later
      </Button>
    </div>
  </div>
)}       
          </CardContent>
        </Card>
      </div>
    </div>
  )
}