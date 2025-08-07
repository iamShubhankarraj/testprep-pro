'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  Loader2, 
  Trophy,
  TrendingUp,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Award,
  BarChart3,
  Star,
  Timer,
  Activity,
  FileText,
  Eye,
  BookOpen,
  AlertCircle,
  Minus,
  PieChart,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

interface TestResult {
  id: string
  score: number
  correct_answers: number
  incorrect_answers: number
  total_questions: number
  time_taken_minutes: number
  completed_at: string
  tests: {
    title: string
    duration_minutes: number
    difficulty_level: string
  }
}

interface QuestionResponse {
  id: string
  question_id: string
  user_answer: string | null
  is_correct: boolean
  time_taken_seconds: number
  question_order: number
  questions: {
    id: string
    question_text: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    correct_answer: 'A' | 'B' | 'C' | 'D'
    subject_id: number | null
    difficulty_level: 'easy' | 'medium' | 'hard'
    subjects?: {
      name: string
    }
  }
}

interface SubjectAnalysis {
  subject: string
  attempted: number
  correct: number
  total: number
  accuracy: number
  timeSpent: number
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')
  const testId = searchParams.get('testId')
  
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    const fetchDetailedResults = async () => {
      if (!attemptId) {
        setError('No test attempt ID provided')
        setLoading(false)
        return
      }

      try {
        // Fetch test attempt data
        const { data: attemptData, error: attemptError } = await supabase
          .from('test_attempts')
          .select(`
            *,
            tests (title, duration_minutes, difficulty_level)
          `)
          .eq('id', attemptId)
          .single()

        if (attemptError) throw attemptError

        // Fetch all questions for this test with user responses
        const { data: testQuestionsData, error: questionsError } = await supabase
          .from('test_questions')
          .select(`
            id,
            question_order,
            questions (
              id,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer,
              subject_id,
              difficulty_level,
              subjects (name)
            )
          `)
          .eq('test_id', testId)
          .order('question_order', { ascending: true })

        if (questionsError) throw questionsError

        // Fetch user responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('test_responses')
          .select('*')
          .eq('attempt_id', attemptId)

        if (responsesError) throw responsesError

        // Combine questions with responses
        const combinedData: QuestionResponse[] = testQuestionsData.map((tq: any) => {
          const userResponse = responsesData?.find(r => r.question_id === tq.questions.id)
          return {
            id: userResponse?.id || `missing-${tq.id}`,
            question_id: tq.questions.id,
            user_answer: userResponse?.user_answer || null,
            is_correct: userResponse?.is_correct || false,
            time_taken_seconds: userResponse?.time_taken_seconds || 0,
            question_order: tq.question_order,
            questions: tq.questions
          }
        })

        // Calculate subject-wise analysis
        const subjectStats: { [key: string]: { attempted: number; correct: number; total: number; timeSpent: number } } = {}
        
        combinedData.forEach(response => {
          const subjectName = response.questions.subjects?.name || 'Unknown'
          if (!subjectStats[subjectName]) {
            subjectStats[subjectName] = { attempted: 0, correct: 0, total: 0, timeSpent: 0 }
          }
          
          subjectStats[subjectName].total++
          subjectStats[subjectName].timeSpent += response.time_taken_seconds
          
          if (response.user_answer) {
            subjectStats[subjectName].attempted++
            if (response.is_correct) {
              subjectStats[subjectName].correct++
            }
          }
        })

        const subjectAnalysisData: SubjectAnalysis[] = Object.entries(subjectStats).map(([subject, stats]) => ({
          subject,
          attempted: stats.attempted,
          correct: stats.correct,
          total: stats.total,
          accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
          timeSpent: stats.timeSpent
        }))

        setTestResult(attemptData)
        setQuestionResponses(combinedData)
        setSubjectAnalysis(subjectAnalysisData)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDetailedResults()
  }, [attemptId, testId])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 75) return 'text-blue-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAnswerStatusIcon = (userAnswer: string | null, correctAnswer: string, isCorrect: boolean) => {
    if (!userAnswer) return <Minus className="w-5 h-5 text-gray-400" />
    if (isCorrect) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-xl font-medium">Analyzing your performance...</p>
        </div>
      </div>
    )
  }

  if (error || !testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden max-w-md">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-1">
            <div className="bg-white rounded-3xl p-8 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Results</h2>
              <p className="text-gray-600 mb-6">{error || 'Test result not found'}</p>
              <Link href="/dashboard">
                <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const totalAttempted = questionResponses.filter(q => q.user_answer).length
  const totalSkipped = questionResponses.length - totalAttempted
  const attemptPercentage = (totalAttempted / questionResponses.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-red-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight">
            Test Results
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Comprehensive analysis of your performance in <span className="font-semibold">{testResult.tests.title}</span>
          </p>

          <Link href="/dashboard">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md rounded-full px-6 py-3 font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Score Overview Card */}
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
            <div className="bg-white rounded-3xl p-8">
              <div className="text-center mb-8">
                <div className={`text-7xl font-black mb-4 ${getScoreColor(testResult.score || 0)}`}>
                  {testResult.score || 0}%
                </div>
                <div className="text-3xl text-gray-800 mb-4">
                  Grade: <span className={`${getScoreColor(testResult.score || 0)} font-bold`}>
                    {getScoreGrade(testResult.score || 0)}
                  </span>
                </div>
                <Progress value={testResult.score || 0} className="h-4 bg-gray-200 rounded-full mb-6" />
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-800">{testResult.correct_answers}</div>
                  <div className="text-gray-600 font-medium">Correct</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200">
                  <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-800">{testResult.incorrect_answers}</div>
                  <div className="text-gray-600 font-medium">Incorrect</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <Clock className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-800">{testResult.time_taken_minutes}m</div>
                  <div className="text-gray-600 font-medium">Time Taken</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                  <Target className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-800">{attemptPercentage.toFixed(1)}%</div>
                  <div className="text-gray-600 font-medium">Attempted</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
                  
                          {/* Detailed Analysis Tabs */}
                          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
                              <div className="bg-white rounded-3xl">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-2xl p-2 m-6">
                                    <TabsTrigger value="summary" className="rounded-xl font-semibold">
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      Summary
                                    </TabsTrigger>
                                    <TabsTrigger value="answerkey" className="rounded-xl font-semibold">
                                      <FileText className="w-4 h-4 mr-2" />
                                      Answer Key
                                    </TabsTrigger>
                                    <TabsTrigger value="analysis" className="rounded-xl font-semibold">
                                      <PieChart className="w-4 h-4 mr-2" />
                                      Subject Analysis
                                    </TabsTrigger>
                                  </TabsList>
                  
                                  {/* Summary Tab */}
                                  <TabsContent value="summary" className="p-6 pt-0">
                                    <div className="space-y-8">
                                      <div className="text-center">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Summary</h3>
                                        <p className="text-gray-600">Overall performance metrics and insights</p>
                                      </div>
                  
                                      {/* Test Overview */}
                                      <div className="grid md:grid-cols-2 gap-8">
                                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                                          <CardHeader>
                                            <CardTitle className="text-lg text-gray-800 flex items-center">
                                              <Timer className="w-5 h-5 mr-2 text-blue-500" />
                                              Time Analysis
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Total Time Allocated:</span>
                                              <span className="font-semibold">{testResult.tests.duration_minutes} minutes</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Time Taken:</span>
                                              <span className="font-semibold">{testResult.time_taken_minutes} minutes</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Time Saved:</span>
                                              <span className="font-semibold text-green-600">
                                                {testResult.tests.duration_minutes - testResult.time_taken_minutes} minutes
                                              </span>
                                            </div>
                                            <Progress 
                                              value={(testResult.time_taken_minutes / testResult.tests.duration_minutes) * 100} 
                                              className="h-2"
                                            />
                                          </CardContent>
                                        </Card>
                  
                                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                                          <CardHeader>
                                            <CardTitle className="text-lg text-gray-800 flex items-center">
                                              <Activity className="w-5 h-5 mr-2 text-green-500" />
                                              Attempt Statistics
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Total Questions:</span>
                                              <span className="font-semibold">{questionResponses.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Questions Attempted:</span>
                                              <span className="font-semibold text-blue-600">{totalAttempted}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Questions Skipped:</span>
                                              <span className="font-semibold text-red-600">{totalSkipped}</span>
                                            </div>
                                            <Progress value={attemptPercentage} className="h-2" />
                                          </CardContent>
                                        </Card>
                                      </div>
                  
                                      {/* Performance Breakdown */}
                                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                                        <CardHeader>
                                          <CardTitle className="text-lg text-gray-800 flex items-center">
                                            <Trophy className="w-5 h-5 mr-2 text-purple-500" />
                                            Performance Breakdown
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center p-4">
                                              <div className="text-3xl font-bold text-green-600 mb-2">{testResult.correct_answers}</div>
                                              <div className="text-gray-600">Correct Answers</div>
                                              <div className="text-sm text-gray-500">
                                                {((testResult.correct_answers / questionResponses.length) * 100).toFixed(1)}% of total
                                              </div>
                                            </div>
                                            <div className="text-center p-4">
                                              <div className="text-3xl font-bold text-red-600 mb-2">{testResult.incorrect_answers}</div>
                                              <div className="text-gray-600">Incorrect Answers</div>
                                              <div className="text-sm text-gray-500">
                                                {((testResult.incorrect_answers / questionResponses.length) * 100).toFixed(1)}% of total
                                              </div>
                                            </div>
                                            <div className="text-center p-4">
                                              <div className="text-3xl font-bold text-gray-600 mb-2">{totalSkipped}</div>
                                              <div className="text-gray-600">Skipped Questions</div>
                                              <div className="text-sm text-gray-500">
                                                {((totalSkipped / questionResponses.length) * 100).toFixed(1)}% of total
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </TabsContent>
                  
                                  {/* Answer Key Tab */}
                                  <TabsContent value="answerkey" className="p-6 pt-0">
                                    <div className="space-y-6">
                                      <div className="text-center">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Answer Key</h3>
                                        <p className="text-gray-600">Review your responses for each question</p>
                                      </div>
                  
                                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                                        {questionResponses.map((response, index) => (
                                          <Card key={response.id} className="bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                            <CardContent className="p-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="text-lg font-bold text-gray-800">Q{index + 1}</span>
                                                    {getAnswerStatusIcon(response.user_answer, response.questions.correct_answer, response.is_correct)}
                                                  </div>
                                                  
                                                  <div className="flex items-center space-x-3">
                                                    <Badge variant="outline" className={getDifficultyColor(response.questions.difficulty_level)}>
                                                      {response.questions.difficulty_level}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                      {response.questions.subjects?.name || 'General'}
                                                    </Badge>
                                                  </div>
                                                </div>
                  
                                                <div className="flex items-center space-x-6 text-sm">
                                                  <div className="text-center">
                                                    <div className="text-gray-500">Your Answer</div>
                                                    <div className={`font-bold text-lg ${
                                                      response.user_answer 
                                                        ? response.is_correct ? 'text-green-600' : 'text-red-600'
                                                        : 'text-gray-400'
                                                    }`}>
                                                      {response.user_answer || 'Not Attempted'}
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="text-center">
                                                    <div className="text-gray-500">Correct Answer</div>
                                                    <div className="font-bold text-lg text-green-600">
                                                      {response.questions.correct_answer}
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="text-center">
                                                    <div className="text-gray-500">Time Spent</div>
                                                    <div className="font-bold text-blue-600">
                                                      {formatTime(response.time_taken_seconds)}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                  
                                              {/* Question Preview */}
                                              <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-gray-700 text-sm line-clamp-2">
                                                  {response.questions.question_text.substring(0, 150)}
                                                  {response.questions.question_text.length > 150 ? '...' : ''}
                                                </p>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </div>
                                  </TabsContent>
                  
                                  {/* Subject Analysis Tab */}
                                  <TabsContent value="analysis" className="p-6 pt-0">
                                    <div className="space-y-6">
                                      <div className="text-center">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Subject-wise Analysis</h3>
                                        <p className="text-gray-600">Performance breakdown by subject areas</p>
                                      </div>
                  
                                      <div className="grid gap-6">
                                        {subjectAnalysis.map((subject, index) => (
                                          <Card key={index} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200">
                                            <CardContent className="p-6">
                                              <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                  <div className="relative">
                                                    <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20"></div>
                                                    <div className="relative bg-blue-500 p-3 rounded-xl">
                                                      <BookOpen className="w-6 h-6 text-white" />
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <h4 className="text-xl font-bold text-gray-800">{subject.subject}</h4>
                                                    <p className="text-gray-600">
                                                      {subject.attempted} of {subject.total} attempted
                                                    </p>
                                                  </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                  <div className={`text-3xl font-bold ${getScoreColor(subject.accuracy)}`}>
                                                    {subject.accuracy.toFixed(1)}%
                                                  </div>
                                                  <div className="text-gray-500 text-sm">Accuracy</div>
                                                </div>
                                              </div>
                  
                                              <div className="grid grid-cols-4 gap-4 mb-4">
                                                <div className="text-center p-3 bg-blue-50 rounded-xl">
                                                  <div className="text-2xl font-bold text-blue-600">{subject.total}</div>
                                                  <div className="text-xs text-gray-600">Total</div>
                                                </div>
                                                <div className="text-center p-3 bg-green-50 rounded-xl">
                                                  <div className="text-2xl font-bold text-green-600">{subject.correct}</div>
                                                  <div className="text-xs text-gray-600">Correct</div>
                                                </div>
                                                <div className="text-center p-3 bg-red-50 rounded-xl">
                                                  <div className="text-2xl font-bold text-red-600">{subject.attempted - subject.correct}</div>
                                                  <div className="text-xs text-gray-600">Wrong</div>
                                                </div>
                                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                                  <div className="text-2xl font-bold text-gray-600">{subject.total - subject.attempted}</div>
                                                  <div className="text-xs text-gray-600">Skipped</div>
                                                </div>
                                              </div>
                  
                                              <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                  <span>Attempt Rate</span>
                                                  <span>{((subject.attempted / subject.total) * 100).toFixed(1)}%</span>
                                                </div>
                                                <Progress value={(subject.attempted / subject.total) * 100} className="h-2" />
                                                
                                                <div className="flex justify-between text-sm">
                                                  <span>Accuracy Rate</span>
                                                  <span>{subject.accuracy.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={subject.accuracy} className="h-2" />
                                              </div>
                  
                                              <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex justify-between text-sm text-gray-600">
                                                  <span>Time Spent:</span>
                                                  <span className="font-medium">{formatTime(subject.timeSpent)}</span>
                                                </div>
                                              </div>
                                            </CardContent>
                                            </Card>
                      ))}
                    </div>

                    {/* Overall Subject Performance Summary */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-800 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
                          Performance Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3">Strongest Subject</h5>
                            {subjectAnalysis.length > 0 && (
                              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                                <Trophy className="w-6 h-6 text-green-500" />
                                <div>
                                  <div className="font-semibold text-green-800">
                                    {subjectAnalysis.reduce((prev, current) => 
                                      prev.accuracy > current.accuracy ? prev : current
                                    ).subject}
                                  </div>
                                  <div className="text-sm text-green-600">
                                    {subjectAnalysis.reduce((prev, current) => 
                                      prev.accuracy > current.accuracy ? prev : current
                                    ).accuracy.toFixed(1)}% accuracy
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3">Needs Improvement</h5>
                            {subjectAnalysis.length > 0 && (
                              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl border border-red-200">
                                <TrendingDown className="w-6 h-6 text-red-500" />
                                <div>
                                  <div className="font-semibold text-red-800">
                                    {subjectAnalysis.reduce((prev, current) => 
                                      prev.accuracy < current.accuracy ? prev : current
                                    ).subject}
                                  </div>
                                  <div className="text-sm text-red-600">
                                    {subjectAnalysis.reduce((prev, current) => 
                                      prev.accuracy < current.accuracy ? prev : current
                                    ).accuracy.toFixed(1)}% accuracy
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <Brain className="w-5 h-5 mr-2" />
                            Recommendations
                          </h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Focus more practice on subjects with lower accuracy rates</li>
                            <li>• Review incorrect answers to understand concept gaps</li>
                            <li>• Maintain consistent performance in your stronger subjects</li>
                            <li>• Work on time management for better attempt rates</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/dashboard/tests">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <BookOpen className="w-5 h-5 mr-2" />
              Take Another Test
            </Button>
          </Link>
          
          <Link href="/dashboard/analytics">
            <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <BarChart3 className="w-5 h-5 mr-2" />
              View Analytics
            </Button>
          </Link>
          
          <Button 
            onClick={() => window.print()} 
            variant="outline" 
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <FileText className="w-5 h-5 mr-2" />
            Print Results
          </Button>
        </div>

        {/* Test Details Footer */}
        <Card className="bg-white/60 backdrop-blur-xl border-0 shadow-lg rounded-2xl mt-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Completed: {new Date(testResult.completed_at).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Duration: {testResult.tests.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Difficulty: {testResult.tests.difficulty_level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Test ID: {testResult.id.substring(0, 8)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}                  