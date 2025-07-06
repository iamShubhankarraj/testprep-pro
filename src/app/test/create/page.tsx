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
import { Loader2, ArrowLeft, PlusCircle, CheckCircle, XCircle, FileText } from 'lucide-react'

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
      // PDF-based test validation
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
      // Manual test validation
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
            subjects: selectedPDF ? null : selectedSubjects, // Only set subjects for manual tests
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

        // Link questions to the test
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          Loading test creation form...
        </div>
      </div>
    )
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
              Create New Test
            </h1>
            <p className="text-lg text-gray-300">
              Create tests from your uploaded PDFs or define custom test blueprints.
            </p>
          </div>
          <Link href="/dashboard/tests">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl px-5 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tests
            </Button>
          </Link>
        </div>

        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl p-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-3xl font-bold">Test Configuration</CardTitle>
            <p className="text-gray-300 text-md">Configure your test settings and question source.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Question Source Selection */}
              <div>
                <Label className="text-white text-lg mb-2 block">Question Source</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="radio"
                      id="manual-questions"
                      name="question-source"
                      checked={!selectedPDF}
                      onChange={() => setSelectedPDF(null)}
                      className="text-blue-500"
                    />
                    <label htmlFor="manual-questions" className="text-white cursor-pointer">
                      Use manually linked questions (traditional method)
                    </label>
                  </div>
                  
                  {availablePDFs.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 mb-3">
                        <input
                          type="radio"
                          id="pdf-questions"
                          name="question-source"
                          checked={!!selectedPDF}
                          onChange={() => setSelectedPDF(availablePDFs[0]?.id || null)}
                          className="text-blue-500"
                        />
                        <label htmlFor="pdf-questions" className="text-white cursor-pointer">
                          Create test from uploaded PDF questions
                        </label>
                      </div>
                      
                      {selectedPDF !== null && (
                        <div className="ml-6 space-y-2 max-h-60 overflow-y-auto">
                          {availablePDFs.map((pdf) => (
                            <div
                              key={pdf.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedPDF === pdf.id
                                  ? 'bg-blue-500/20 border-blue-400'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                              onClick={() => setSelectedPDF(pdf.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-blue-400" />
                                <div className="flex-1">
                                  <div className="text-white font-medium">{pdf.title}</div>
                                  <div className="text-gray-400 text-sm">
                                    {pdf.total_questions} questions • {new Date(pdf.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {availablePDFs.length === 0 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                      <p className="text-yellow-300 text-sm">
                        No PDFs with extracted questions found. 
                        <Link href="/dashboard/upload" className="text-yellow-200 underline ml-1">
                          Upload a PDF
                        </Link> to create tests from your documents.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Test Information */}
              <div>
                <Label htmlFor="title" className="text-white text-lg mb-2 block">Test Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., JEE Main Mock Test 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white text-lg mb-2 block">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of the test content or focus."
                  value={description}

                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3 min-h-[100px]"
                  />
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="totalQuestions" className="text-white text-lg mb-2 block">Total Questions</Label>
                    <Input
                      id="totalQuestions"
                      type="number"
                      placeholder="e.g., 50"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(parseInt(e.target.value)|| 50)}
                      min="1"
                      max={selectedPDF ? availablePDFs.find(pdf => pdf.id === selectedPDF)?.total_questions : undefined}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
                      required
                    />
                    {selectedPDF && (
                      <p className="text-gray-400 text-sm mt-1">
                        Max: {availablePDFs.find(pdf => pdf.id === selectedPDF)?.total_questions} questions available
                      </p>
                    )}
                  </div>
  
                  <div>
                    <Label htmlFor="durationMinutes" className="text-white text-lg mb-2 block">Duration (Minutes)</Label>
                    <Input
                      id="durationMinutes"
                      type="number"
                      placeholder="e.g., 180"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                      min="1"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
                      required
                    />
                  </div>
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="difficultyLevel" className="text-white text-lg mb-2 block">Difficulty Level</Label>
                    <Select value={difficultyLevel} onValueChange={(value: 'easy' | 'medium' | 'hard' | 'mixed') => setDifficultyLevel(value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg p-3">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div>
                    <Label htmlFor="testType" className="text-white text-lg mb-2 block">Test Type</Label>
                    <Select value={testType} onValueChange={(value: 'practice' | 'mock' | 'custom') => setTestType(value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg p-3">
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="mock">Mock Test</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
  
                {/* Subjects Selection - Only show for manual tests */}
                {!selectedPDF && (
                  <div>
                    <Label className="text-white text-lg mb-2 block">Subjects</Label>
                    <div className="flex flex-wrap gap-3">
                      {subjects.length > 0 ? (
                        subjects.map((subject) => (
                          <Button
                            key={subject.id}
                            type="button"
                            variant={selectedSubjects.includes(subject.name) ? 'default' : 'outline'}
                            onClick={() => handleSubjectToggle(subject.name)}
                            className={`
                              rounded-full px-5 py-2 text-md transition-all duration-200
                              ${selectedSubjects.includes(subject.name)
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md hover:from-blue-600 hover:to-purple-600'
                                : 'border-white/30 text-gray-300 hover:bg-white/10 hover:text-white'
                              }
                            `}
                          >
                            {subject.name}
                          </Button>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No subjects available. Please add subjects to your database.</p>
                      )}
                    </div>
                  </div>
                )}
  
                {/* Error and Success Messages */}
                {error && (
                  <div className="flex items-center p-4 rounded-xl shadow-md bg-red-500/20 text-red-300 border border-red-400 animate-fade-in">
                    <XCircle className="w-6 h-6 mr-3" />
                    <p className="text-lg font-medium">{error}</p>
                  </div>
                )}
  
                {success && (
                  <div className="flex items-center p-4 rounded-xl shadow-md bg-green-500/20 text-green-300 border border-green-400 animate-fade-in">
                    <CheckCircle className="w-6 h-6 mr-3" />
                    <p className="text-lg font-medium">{success}</p>
                  </div>
                )}
  
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || !user}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-4 px-6 rounded-xl text-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Creating Test...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-6 h-6 mr-3" />
                      {selectedPDF ? 'Create Test from PDF' : 'Create Test Blueprint'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }