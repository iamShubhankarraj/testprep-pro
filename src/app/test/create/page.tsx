'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  ArrowLeft, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Sparkles, 
  Target, 
  Clock, 
  Brain, 
  Zap,
  Star,
  BookOpen,
  Settings,
  Layers,
  TrendingUp
} from 'lucide-react'

interface Subject {
  id: number;
  name: string;
}

interface PDFWithQuestions {
  id: string;
  title: string;
  total_questions: number;
  created_at: string;
}

export default function CreateTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [availablePDFs, setAvailablePDFs] = useState<PDFWithQuestions[]>([])
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalQuestions, setTotalQuestions] = useState<number>(50)
  const [durationMinutes, setDurationMinutes] = useState<number>(180)
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
  const [testType, setTestType] = useState<'practice' | 'mock' | 'custom'>('practice')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null)

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !supabaseUser) {
          console.error("Authentication error or no user:", authError);
          router.push('/auth/login');
          return;
        }
        setUser({ id: supabaseUser.id });

        // Load subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name', { ascending: true });

        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError);
          setError('Failed to load subjects. Please try again.');
        } else {
          setSubjects(subjectsData || []);
        }

        // Load PDFs with questions
        const { data: pdfsData, error: pdfsError } = await supabase
          .from('pdfs')
          .select('id, title, total_questions, created_at')
          .eq('user_id', supabaseUser.id)
          .eq('processing_status', 'completed')
          .gt('total_questions', 0)
          .order('created_at', { ascending: false });

        if (!pdfsError && pdfsData) {
          setAvailablePDFs(pdfsData);
        }

      } catch (e: unknown) {
        console.error("Unexpected error during initial data load:", e);
        setError(`An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [router]);

  const handleSubjectToggle = (subjectName: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectName)
        ? prev.filter(name => name !== subjectName)
        : [...prev, subjectName]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!user) {
      setError('User not authenticated. Please log in.')
      setSubmitting(false)
      return
    }

    if (!title.trim() || totalQuestions <= 0 || durationMinutes <= 0) {
      setError('Please fill in all required fields (Title, Total Questions, Duration).')
      setSubmitting(false)
      return
    }

    // Validation based on source type
    if (selectedPDF) {
      const selectedPDFData = availablePDFs.find(pdf => pdf.id === selectedPDF)
      if (!selectedPDFData) {
        setError('Selected PDF not found.')
        setSubmitting(false)
        return
      }
      if (totalQuestions > selectedPDFData.total_questions) {
        setError(`Cannot create test with ${totalQuestions} questions. PDF only has ${selectedPDFData.total_questions} questions.`)
        setSubmitting(false)
        return
      }
    } else {
      if (selectedSubjects.length === 0) {
        setError('Please select at least one subject for manual test creation.')
        setSubmitting(false)
        return
      }
    }

    try {
      // Create the test
      const { data: insertedTestData, error: insertError } = await supabase
        .from('tests')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            total_questions: totalQuestions,
            duration_minutes: durationMinutes,
            difficulty_level: difficultyLevel,
            test_type: testType,
            subjects: selectedPDF ? null : selectedSubjects,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const testId = insertedTestData.id

      // If PDF is selected, link questions from that PDF
      if (selectedPDF) {
        const { data: pdfQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id')
          .eq('pdf_id', selectedPDF)
          .eq('user_id', user.id)
          .limit(totalQuestions)

        if (questionsError) {
          throw new Error(`Failed to fetch PDF questions: ${questionsError.message}`)
        }

        if (!pdfQuestions || pdfQuestions.length === 0) {
          throw new Error('No questions found in the selected PDF')
        }

        const testQuestionLinks = pdfQuestions.map((question, index) => ({
          test_id: testId,
          question_id: question.id,
          question_order: index + 1
        }))

        const { error: linkError } = await supabase
          .from('test_questions')
          .insert(testQuestionLinks)

        if (linkError) {
          throw new Error(`Failed to link questions to test: ${linkError.message}`)
        }

        setSuccess(`Test created successfully with ${pdfQuestions.length} questions from your PDF! You can now take the test.`)
      } else {
        setSuccess('Test blueprint created successfully! You can now manually link questions in Supabase or take the test with dummy questions.')
      }

      console.log('Successfully created test:', insertedTestData);

      // Reset form
      setTitle('')
      setDescription('')
      setTotalQuestions(50)
      setDurationMinutes(180)
      setDifficultyLevel('mixed')
      setTestType('practice')
      setSelectedSubjects([])
      setSelectedPDF(null)

      // Redirect to test after 2 seconds
      setTimeout(() => {
        router.push(`/test/${testId}/start`)
      }, 2000)

    } catch (err: unknown) {
      console.error('Error creating test:', err)
      setError(`Failed to create test: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-emerald-600'
      case 'medium': return 'from-yellow-500 to-orange-600'
      case 'hard': return 'from-red-500 to-pink-600'
      case 'mixed': return 'from-purple-500 to-indigo-600'
      default: return 'from-gray-500 to-slate-600'
    }
  }

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'practice': return <Target className="w-5 h-5" />
      case 'mock': return <TrendingUp className="w-5 h-5" />
      case 'custom': return <Settings className="w-5 h-5" />
      default: return <BookOpen className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-xl font-medium">Loading test creation studio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-red-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.03&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Test Creation
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
              Studio
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Design personalized assessments with AI-powered question extraction or create custom test blueprints tailored to your learning goals.
          </p>

          <Link href="/dashboard/tests">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md rounded-full px-6 py-3 font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
          </Link>
        </div>

        {/* Main Creation Interface */}
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
              <div className="bg-white rounded-3xl">
                <CardHeader className="text-center py-12 px-8">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
                    <CardTitle className="relative text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center">
                      <Sparkles className="w-8 h-8 mr-3 text-blue-600" />
                      Configure Your Test
                    </CardTitle>
                  </div>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                    Choose your question source, set parameters, and create the perfect assessment for your learning journey.
                  </p>
                </CardHeader>

                <CardContent className="px-8 pb-12">
                  <form onSubmit={handleSubmit} className="space-y-10">
                    
                    {/* Question Source Selection */}
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                          <Layers className="w-6 h-6 mr-2 text-purple-600" />
                          Choose Question Source
                        </h3>
                        <p className="text-gray-600">Select how you want to generate questions for your test</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Manual Questions Option */}
                        <div 
                          className={`group p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            !selectedPDF 
                              ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPDF(null)}
                        >
                          <div className="text-center">
                            <div className="relative inline-block mb-6">
                              <div className={`absolute inset-0 rounded-2xl blur-lg opacity-30 transition-opacity duration-300 ${
                                !selectedPDF ? 'bg-blue-500' : 'bg-gray-400'
                              }`}></div>
                              <div className={`relative p-4 rounded-2xl transition-colors duration-300 ${
                                !selectedPDF ? 'bg-blue-500' : 'bg-gray-400'
                              }`}>
                                <Settings className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 mb-3">Manual Configuration</h4>
                            <p className="text-gray-600 leading-relaxed">
                              Create a test blueprint with custom subjects and manually link questions later
                            </p>
                            <div className="mt-4">
                              <Badge variant={!selectedPDF ? "default" : "secondary"} className="px-4 py-2">
                                Traditional Method
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* PDF Questions Option */}
                        <div 
                          className={`group p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            selectedPDF 
                              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => availablePDFs.length > 0 && setSelectedPDF(availablePDFs[0]?.id || null)}
                        >
                          <div className="text-center">
                            <div className="relative inline-block mb-6">
                              <div className={`absolute inset-0 rounded-2xl blur-lg opacity-30 transition-opacity duration-300 ${
                                selectedPDF ? 'bg-purple-500' : 'bg-gray-400'
                              }`}></div>
                              <div className={`relative p-4 rounded-2xl transition-colors duration-300 ${
                                selectedPDF ? 'bg-purple-500' : 'bg-gray-400'
                              }`}>
                                <Brain className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 mb-3">AI-Extracted Questions</h4>
                            <p className="text-gray-600 leading-relaxed">
                              Use questions automatically extracted from your uploaded PDFs
                            </p>
                            <div className="mt-4">
                              <Badge variant={selectedPDF ? "default" : "secondary"} className="px-4 py-2">
                                AI-Powered
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PDF Selection */}
                      {selectedPDF !== null && availablePDFs.length > 0 && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-purple-600" />
                            Select Your PDF
                          </h4>
                          <div className="grid gap-4 max-h-64 overflow-y-auto custom-scrollbar">
                            {availablePDFs.map((pdf) => (
                              <div
                                key={pdf.id}
                                className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                                  selectedPDF === pdf.id
                                    ? 'border-purple-400 bg-white shadow-lg'
                                    : 'border-gray-200 bg-white/70 hover:border-purple-300'
                                }`}
                                onClick={() => setSelectedPDF(pdf.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl transition-colors duration-300 ${
                                      selectedPDF === pdf.id ? 'bg-purple-500' : 'bg-gray-400'
                                    }`}>
                                      <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-800">{pdf.title}</h5>
                                      <p className="text-sm text-gray-600">
                                        {pdf.total_questions} questions • {new Date(pdf.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  {selectedPDF === pdf.id && (
                                    <CheckCircle className="w-6 h-6 text-purple-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No PDFs Available Message */}
                      {availablePDFs.length === 0 && (
                        <div className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl text-center">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-lg opacity-20"></div>
                            <div className="relative bg-yellow-500 p-4 rounded-full">
                              <Zap className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">No PDFs with Questions Found</h4>
                          <p className="text-gray-600 mb-6">
                            Upload and process a PDF to unlock AI-powered question extraction
                          </p>
                          <Link href="/dashboard/upload">
                            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Upload PDF
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Test Configuration */}
                    <div className="space-y-8">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                          <Target className="w-6 h-6 mr-2 text-blue-600" />
                          Test Configuration
                        </h3>
                        <p className="text-gray-600">Define the parameters and settings for your test</p>
                      </div>

                      {/* Basic Information */}
                      <div className="grid gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="title" className="text-lg font-semibold text-gray-800 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-500" />
                            Test Title
                          </Label>
                          <Input
                            id="title"
                            type="text"
                            placeholder="e.g., JEE Main Physics Mock Test"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="description" className="text-lg font-semibold text-gray-800 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-500" />
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the focus areas, topics covered, or learning objectives of this test..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 min-h-[120px] resize-none"
                          />
                        </div>

                        {/* Test Parameters Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label htmlFor="totalQuestions" className="text-lg font-semibold text-gray-800 flex items-center">
                              <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                              Total Questions
                            </Label>
                            <Input
                              id="totalQuestions"
                              type="number"
                              placeholder="50"
                              value={totalQuestions}
                              onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 50)}
                              min="1"
                              max={selectedPDF ? availablePDFs.find(pdf => pdf.id === selectedPDF)?.total_questions : undefined}
                              className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                              required
                            />
                            {selectedPDF && (
                              <p className="text-sm text-gray-500 flex items-center">
                                <Target className="w-4 h-4 mr-1" />
                                Max: {availablePDFs.find(pdf => pdf.id === selectedPDF)?.total_questions} questions available
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="durationMinutes" className="text-lg font-semibold text-gray-800 flex items-center">
                              <Clock className="w-5 h-5 mr-2 text-orange-500" />
                              Duration (Minutes)
                            </Label>
                            <Input
                              id="durationMinutes"
                              type="number"
                              placeholder="180"
                              value={durationMinutes}
                              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 180)}
                              min="1"
                              className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors duration-200"
                              required
                            />
                          </div>
                        </div>

                        {/* Difficulty and Type Selection */}
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-lg font-semibold text-gray-800 flex items-center">
                              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                              Difficulty Level
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              {['easy', 'medium', 'hard', 'mixed'].map((difficulty) => (
                                <button
                                  key={difficulty}
                                  type="button"
                                  onClick={() => setDifficultyLevel(difficulty as any)}
                                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                                    difficultyLevel === difficulty
                                      ? `border-transparent bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white shadow-lg`
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-semibold capitalize">{difficulty}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-lg font-semibold text-gray-800 flex items-center">
                              <Settings className="w-5 h-5 mr-2 text-indigo-500" />
                              Test Type
                            </Label>
                            <div className="space-y-3">
                              {[
                                { value: 'practice', label: 'Practice Test', desc: 'For regular practice' },
                                { value: 'mock', label: 'Mock Test', desc: 'Exam simulation' },
                                { value: 'custom', label: 'Custom Test', desc: 'Personalized assessment' }
                              ].map((type) => (
                                <button
                                  key={type.value}
                                  type="button"
                                  onClick={() => setTestType(type.value as any)}
                                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md text-left ${
                                    testType === type.value
                                      ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <div className={`p-2 rounded-lg mr-3 ${
                                      testType === type.value ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {getTestTypeIcon(type.value)}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-800">{type.label}</div>
                                      <div className="text-sm text-gray-600">{type.desc}</div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Subjects Selection - Only for manual tests */}
                        {!selectedPDF && (
                          <div className="space-y-6">
                            <div className="text-center">
                              <Label className="text-lg font-semibold text-gray-800 flex items-center justify-center">
                                <Layers className="w-5 h-5 mr-2 text-emerald-500" />
                                Select Subjects
                              </Label>
                              <p className="text-gray-600 mt-1">Choose the subjects to include in your test</p>
                            </div>
                            
                            {subjects.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {subjects.map((subject) => (
                                  <button
                                    key={subject.id}
                                    type="button"
                                    onClick={() => handleSubjectToggle(subject.name)}
                                    className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                                      selectedSubjects.includes(subject.name)
                                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg'
                                        : 'border-gray-200 bg-white hover:border-emerald-300'
                                    }`}
                                  >
                                    <div className="text-center">
                                      <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors duration-300 ${
                                        selectedSubjects.includes(subject.name)
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-gray-200 text-gray-600 group-hover:bg-emerald-100'
                                      }`}>
                                        <BookOpen className="w-6 h-6" />
                                      </div>
                                      <div className="font-semibold text-gray-800">{subject.name}</div>
                                      {selectedSubjects.includes(subject.name) && (
                                        <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mt-2" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 bg-gray-50 rounded-2xl border-2 border-gray-200">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No subjects available. Please add subjects to your database.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Messages */}
                    {error && (
                      <div className="p-6 rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 animate-fade-in">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <XCircle className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-lg font-semibold text-red-800 mb-1">Error Creating Test</h4>
                            <p className="text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 animate-fade-in">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-lg font-semibold text-green-800 mb-1">Test Created Successfully!</h4>
                            <p className="text-green-700">{success}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-8">
                      <Button
                        type="submit"
                        disabled={submitting || !user}
                        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 px-8 rounded-2xl text-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            <span>Creating Your Test...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Sparkles className="w-6 h-6 mr-3" />
                            <span>
                              {selectedPDF ? 'Create AI-Powered Test' : 'Create Test Blueprint'}
                            </span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* Custom Styles */}
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
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  )
}