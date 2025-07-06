'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
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
  Activity
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

interface QuestionAnalysis {
  difficulty: 'easy' | 'medium' | 'hard'
  correct: number
  total: number
  avgTime: number
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')
  
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([])
  const [error, setError] = useState<string | null>(null)

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

        // Fetch question responses for detailed analysis
        const { data: responsesData, error: responsesError } = await supabase
          .from('test_responses')
          .select(`
            *,
            questions (difficulty_level)
          `)
          .eq('attempt_id', attemptId)

        if (responsesError) throw responsesError

        // Calculate difficulty-wise performance
        const difficultyStats: { [key: string]: { correct: number; total: number; totalTime: number } } = {
          easy: { correct: 0, total: 0, totalTime: 0 },
          medium: { correct: 0, total: 0, totalTime: 0 },
          hard: { correct: 0, total: 0, totalTime: 0 }
        }

        responsesData?.forEach((response: unknown) => {
          const typedResponse = response as { questions?: { difficulty_level?: string }; is_correct?: boolean; time_taken_seconds?: number }
          const difficulty = typedResponse.questions?.difficulty_level || 'medium'
          difficultyStats[difficulty].total++
          if (typedResponse.is_correct) {
            difficultyStats[difficulty].correct++
          }
          difficultyStats[difficulty].totalTime += typedResponse.time_taken_seconds || 0
        })

        const analysis: QuestionAnalysis[] = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          correct: stats.correct,
          total: stats.total,
          avgTime: stats.total > 0 ? stats.totalTime / stats.total : 0
        }))

        setTestResult(attemptData)
        setQuestionAnalysis(analysis)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDetailedResults()
  }, [attemptId])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 75) return 'text-blue-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
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
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          Loading detailed results...
        </div>
      </div>
    )
  }

  if (error || !testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-red-900/20 backdrop-blur-xl border-red-500/50 text-red-300">
            <CardContent className="p-8 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Error Loading Results</h2>
              <p>{error || 'Test result not found'}</p>
              <Link href="/dashboard" className="mt-4 inline-block">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const accuracy = testResult.total_questions > 0 ? (testResult.correct_answers / testResult.total_questions) * 100 : 0
  const timeEfficiency = testResult.tests.duration_minutes > 0 ? ((testResult.tests.duration_minutes - testResult.time_taken_minutes) / testResult.tests.duration_minutes) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Test Results</h1>
            <p className="text-gray-300 text-lg">Your performance summary</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Main Score Card */}
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl mb-8 p-8">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(testResult.score || 0)}`}>
              {testResult.score || 0}%
            </div>
            <div className="text-2xl text-white mb-2">
              Grade: <span className={getScoreColor(testResult.score || 0)}>{getScoreGrade(testResult.score || 0)}</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{testResult.tests.title}</h2>
          </div>

          <Progress value={testResult.score || 0} className="h-4 bg-white/20 rounded-full mb-8" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{testResult.correct_answers}</div>
              <div className="text-gray-300 text-sm">Correct</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{testResult.incorrect_answers}</div>
              <div className="text-gray-300 text-sm">Incorrect</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{testResult.time_taken_minutes}m</div>
              <div className="text-gray-300 text-sm">Time Taken</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{accuracy.toFixed(1)}%</div>
              <div className="text-gray-300 text-sm">Accuracy</div>
            </div>
          </div>
        </Card>

        {/* Test Details */}
        <Card className="bg-white/5 backdrop-blur-3xl border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-gray-300">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Completed: {new Date(testResult.completed_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {testResult.tests.duration_minutes} minutes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}