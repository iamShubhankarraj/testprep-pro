'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle, XCircle, Trash2, Brain, PlusCircle, Sparkles, Zap, Target, Clock, BookOpen, Play, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
      
      const { data: pdfQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('pdf_id', extractedPdfId)
        .eq('user_id', user.id)
        .limit(questionsExtracted)
      
      if (questionsError || !pdfQuestions || pdfQuestions.length === 0) {
        throw new Error('Failed to fetch questions from PDF')
      }
      
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

      const { data: pdfData, error: dbError } = await supabase
        .from('pdfs')
        .insert([
          {
            user_id: user.id,
            file_name: selectedFile.name,
            file_url: uploadData.path,
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

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('userId', user.id)
      formData.append('pdfId', pdfData.id)

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Transform PDFs into
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
              Smart Tests
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Upload your study materials and watch our AI instantly extract questions, 
            create personalized tests, and accelerate your learning journey.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-gray-700">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Instant Processing</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Target className="w-5 h-5 text-green-500" />
              <span className="font-semibold">AI-Powered Extraction</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Smart Analytics</span>
            </div>
          </div>

          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md rounded-full px-6 py-3 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Main Upload Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
              <div className="bg-white rounded-3xl">
                <CardHeader className="text-center py-12 px-8">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
                    <CardTitle className="relative text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      AI Document Processor
                    </CardTitle>
                  </div>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                    Drop your PDF and let our advanced AI extract questions, analyze content, 
                    and create comprehensive tests tailored to your learning needs.
                  </p>
                </CardHeader>

                <CardContent className="px-8 pb-12">
                  {/* Upload Zone */}
                  <div
                    className={`relative border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-500 ease-out group cursor-pointer
                      ${isDragging 
                        ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 scale-105 shadow-2xl' 
                        : 'border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:shadow-xl hover:scale-102'
                      }
                    `}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {/* Floating Elements */}
                    <div className="absolute top-4 left-4 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                    <div className="absolute top-8 right-8 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
                    <div className="absolute bottom-6 left-8 w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-2000"></div>

                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e.target.files)}
                      className="hidden"
                      id="file-upload-input"
                    />
                    
                    <div className="relative z-10">
                      <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <Upload className="relative w-20 h-20 text-blue-500 mx-auto animate-bounce-slow group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                        Drop your PDF here
                      </h3>
                      <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                        Or click to browse and select your study material
                      </p>
                      
                      <label htmlFor="file-upload-input">
                        <Button asChild className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-105">
                          <span className="flex items-center">
                            <FileText className="w-6 h-6 mr-3" />
                            Choose PDF File
                          </span>
                        </Button>
                      </label>
                      
                      <p className="text-sm text-gray-500 mt-6">
                        Supports PDF files up to 50MB • AI processes in seconds
                      </p>
                    </div>
                  </div>

                  {/* Selected File Display */}
                  {selectedFile && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-20"></div>
                            <div className="relative bg-green-500 p-3 rounded-xl">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-semibold text-gray-800 truncate max-w-xs">
                              {selectedFile.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setSelectedFile(null)}
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-100 rounded-full transition-colors duration-200"
                          title="Remove file"
                          disabled={uploading || processing}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status Messages */}
                  {message && (
                    <div className={`mt-8 p-6 rounded-2xl shadow-lg animate-fade-in border-l-4 ${
                      uploadSuccess 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800' 
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500 text-red-800'
                    }`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {uploadSuccess ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-lg font-medium leading-relaxed">{message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions Extracted Success */}
                  {questionsExtracted !== null && questionsExtracted > 0 && !showTestForm && (
                    <div className="mt-8 p-8 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-200 shadow-xl">
                      <div className="text-center">
                        <div className="relative inline-block mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                          <Brain className="relative w-16 h-16 text-blue-600 mx-auto" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          🎉 {questionsExtracted} Questions Extracted!
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Your PDF has been successfully processed. Ready to create your test?
                        </p>
                        <div className="flex justify-center gap-4">
                          <Button
                            onClick={() => setShowTestForm(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                          >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Configure Test
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="mt-8">
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploading || processing}
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 px-8 rounded-2xl text-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none disabled:hover:shadow-xl"
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          <span>Uploading PDF...</span>
                        </div>
                      ) : processing ? (
                        <div className="flex items-center justify-center">
                          <Brain className="w-6 h-6 mr-3 animate-pulse" />
                          <span>AI Processing Questions...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Sparkles className="w-6 h-6 mr-3" />
                          <span>Process with AI</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Test Configuration Form */}
          {showTestForm && questionsExtracted && (
            <Card className="mt-8 bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-1">
                <div className="bg-white rounded-3xl">
                  <CardHeader className="text-center py-8">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center">
                      <Brain className="w-8 h-8 mr-3 text-purple-600" />
                      Configure Your Test
                    </CardTitle>
                    <p className="text-gray-600 text-lg mt-2">
                      {questionsExtracted} questions ready • Customize your learning experience
                    </p>
                  </CardHeader>

                  <CardContent className="px-8 pb-8">
                    <div className="grid gap-8">
                      {/* Test Title */}
                      <div className="space-y-3">
                        <Label htmlFor="test-title" className="text-lg font-semibold text-gray-800 flex items-center">
                          <Star className="w-5 h-5 mr-2 text-yellow-500" />
                          Test Title
                        </Label>
                        <Input
                          id="test-title"
                          type="text"
                          value={testTitle}
                          onChange={(e) => setTestTitle(e.target.value)}
                          className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200"
                          placeholder="Enter an engaging test title"
                        />
                      </div>

                      {/* Test Description */}
                      <div className="space-y-3">
                        <Label htmlFor="test-description" className="text-lg font-semibold text-gray-800 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-500" />
                          Description
                        </Label>
                        <Textarea
                          id="test-description"
                          value={testDescription}
                          onChange={(e) => setTestDescription(e.target.value)}
                          className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 min-h-[120px] resize-none"
                          placeholder="Describe what this test covers and its learning objectives"
                        />
                      </div>

                      {/* Duration and Questions Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="test-duration" className="text-lg font-semibold text-gray-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-green-500" />
                            Duration (Minutes)
                          </Label>
                          <Input
                            id="test-duration"
                            type="number"
                            value={testDuration}
                            onChange={(e) => setTestDuration(parseInt(e.target.value) || 180)}
                            min="30"
                            max="300"
                            className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold text-gray-800 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-orange-500" />
                            Questions Available
                          </Label>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 text-lg font-semibold text-blue-800">
                            {questionsExtracted} questions extracted
                          </div>
                        </div>
                      </div>

                      {/* Create Test Button */}
                      <Button
                        onClick={handleCreateTest}
                        disabled={creatingTest || !testTitle.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white py-6 px-8 rounded-2xl text-xl font-bold transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                      >
                        {creatingTest ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            <span>Creating Your Test...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <PlusCircle className="w-6 h-6 mr-3" />
                            <span>Create Test</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          )}

          {/* Test Created Success */}
          {createdTestId && (
            <Card className="mt-8 bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-1">
                <div className="bg-white rounded-3xl">
                  <CardContent className="text-center py-12 px-8">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                      <CheckCircle className="relative w-20 h-20 text-green-600 mx-auto" />
                    </div>
                    
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">
                      🎉 Test Created Successfully!
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                      Your test &quot;<span className="font-semibold text-gray-800">{testTitle}</span>&quot; is ready with {questionsExtracted} questions. 
                      Start practicing now or save it for later!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-md mx-auto">
                      <Button
                        onClick={() => router.push(`/test/${createdTestId}/start`)}
                        className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Test Now
                      </Button>
                      
                      <Button
                        onClick={() => router.push('/dashboard/tests')}
                        variant="outline"
                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        <BookOpen className="w-5 h-5 mr-2" />
                        View All Tests
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Why Choose Our AI-Powered Platform?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of learning with cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group">
              <Card className="h-full bg-white/70 backdrop-blur-lg border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Lightning Fast</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Process PDFs and extract questions in seconds with our advanced AI algorithms
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <Card className="h-full bg-white/70 backdrop-blur-lg border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Smart AI</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Intelligent question extraction with context understanding and difficulty analysis
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <Card className="h-full bg-white/70 backdrop-blur-lg border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-green-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-teal-600 p-4 rounded-2xl">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Personalized</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Customizable tests with adaptive difficulty and detailed performance analytics
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}