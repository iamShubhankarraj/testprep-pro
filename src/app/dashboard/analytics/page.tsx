'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Clock, 
  Brain,
  Trophy,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Star,
  Award,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  totalTests: number
  totalQuestions: number
  averageScore: number
  totalStudyTime: number
  studyStreak: number
  completionRate: number
  weeklyProgress: number
  monthlyProgress: number
  bestScore: number
  worstScore: number
  totalPdfs: number
  recentActivity: any[]
  subjectPerformance: any[]
  scoreHistory: any[]
  timeSpentBySubject: any[]
  difficultyBreakdown: any[]
  weeklyStats: any[]
}

interface SubjectStats {
  subject: string
  averageScore: number
  testsCount: number
  timeSpent: number
  improvement: number
  color: string
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeframe])

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      setRefreshing(true)

      // Calculate date range based on timeframe
      const now = new Date()
      let startDate = new Date()
      
      switch (selectedTimeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'all':
          startDate = new Date('2020-01-01')
          break
      }

      // Fetch comprehensive analytics data
      const [
        testsResult,
        questionsResult,
        pdfsResult,
        attemptsResult,
        subjectsResult
      ] = await Promise.all([
        supabase.from('tests').select('id, created_at').eq('user_id', user.id),
        supabase.from('questions').select('id, subject_id, difficulty').eq('user_id', user.id),
        supabase.from('pdfs').select('id, created_at').eq('user_id', user.id),
        supabase
          .from('test_attempts')
          .select(`
            id,
            score,
            completed_at,
            duration,
            tests (
              id,
              title,
              total_questions,
              subjects (id, name)
            )
          `)
          .eq('user_id', user.id)
          .gte('completed_at', startDate.toISOString())
          .order('completed_at', { ascending: false }),
        supabase.from('subjects').select('id, name')
      ])

      const tests = testsResult.data || []
      const questions = questionsResult.data || []
      const pdfs = pdfsResult.data || []
      const attempts = attemptsResult.data || []
      const subjects = subjectsResult.data || []

      // Calculate comprehensive statistics
      const totalTests = tests.length
      const totalQuestions = questions.length
      const totalPdfs = pdfs.length
      
      const completedAttempts = attempts.filter(a => a.score !== null)
      const scores = completedAttempts.map(a => a.score || 0)
      
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const worstScore = scores.length > 0 ? Math.min(...scores) : 0
      
      const totalStudyTime = Math.round(completedAttempts.reduce((sum, a) => sum + (a.duration || 45), 0) / 60)
      const completionRate = totalTests > 0 ? Math.round((completedAttempts.length / totalTests) * 100) : 0
      
      // Calculate streaks and progress
      const studyStreak = calculateStudyStreak(attempts)
      const weeklyProgress = calculateWeeklyProgress(attempts)
      const monthlyProgress = calculateMonthlyProgress(attempts)

      // Subject performance analysis
      const subjectPerformance = calculateSubjectPerformance(attempts, subjects)
      
      // Score history for trends
      const scoreHistory = calculateScoreHistory(attempts)
      
      // Time spent by subject
      const timeSpentBySubject = calculateTimeBySubject(attempts, subjects)
      
      // Difficulty breakdown
      const difficultyBreakdown = calculateDifficultyBreakdown(questions)
      
      // Weekly stats for charts
      const weeklyStats = calculateWeeklyStats(attempts)

      setAnalytics({
        totalTests,
        totalQuestions,
        averageScore,
        totalStudyTime,
        studyStreak,
        completionRate,
        weeklyProgress,
        monthlyProgress,
        bestScore,
        worstScore,
        totalPdfs,
        recentActivity: attempts.slice(0, 10),
        subjectPerformance,
        scoreHistory,
        timeSpentBySubject,
        difficultyBreakdown,
        weeklyStats
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateStudyStreak = (attempts: any[]) => {
    if (attempts.length === 0) return 0
    
    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasActivity = attempts.some(a => 
        a.completed_at && a.completed_at.split('T')[0] === dateStr
      )
      
      if (hasActivity) {
        streak++
      } else if (streak > 0) {
        break
      }
      
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    return streak
  }

  const calculateWeeklyProgress = (attempts: any[]) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    return attempts.filter(a => new Date(a.completed_at) > weekStart).length
  }

  const calculateMonthlyProgress = (attempts: any[]) => {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - 1)
    return attempts.filter(a => new Date(a.completed_at) > monthStart).length
  }

  const calculateSubjectPerformance = (attempts: any[], subjects: any[]): SubjectStats[] => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
    
    return subjects.map((subject, index) => {
      const subjectAttempts = attempts.filter(a => a.tests?.subjects?.id === subject.id)
      const scores = subjectAttempts.map(a => a.score || 0)
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
      const timeSpent = Math.round(subjectAttempts.reduce((sum, a) => sum + (a.duration || 45), 0) / 60)
      
      // Calculate improvement (simplified)
      const recentScores = scores.slice(0, 3)
      const olderScores = scores.slice(3, 6)
      const recentAvg = recentScores.length > 0 ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length : 0
      const olderAvg = olderScores.length > 0 ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length : 0
      const improvement = recentAvg - olderAvg
      
      return {
        subject: subject.name,
        averageScore,
        testsCount: subjectAttempts.length,
        timeSpent,
        improvement,
        color: colors[index % colors.length]
      }
    }).filter(s => s.testsCount > 0)
  }

  const calculateScoreHistory = (attempts: any[]) => {
    return attempts
      .slice(0, 20)
      .reverse()
      .map((attempt, index) => ({
        test: index + 1,
        score: attempt.score || 0,
        date: new Date(attempt.completed_at).toLocaleDateString()
      }))
  }

  const calculateTimeBySubject = (attempts: any[], subjects: any[]) => {
    return subjects.map(subject => {
      const subjectAttempts = attempts.filter(a => a.tests?.subjects?.id === subject.id)
      const timeSpent = subjectAttempts.reduce((sum, a) => sum + (a.duration || 45), 0)
      return {
        subject: subject.name,
        time: Math.round(timeSpent / 60),
        percentage: 0 // Will be calculated after getting total
      }
    }).filter(s => s.time > 0)
  }

  const calculateDifficultyBreakdown = (questions: any[]) => {
    const difficulties = ['easy', 'medium', 'hard']
    return difficulties.map(difficulty => {
      const count = questions.filter(q => q.difficulty === difficulty).length
      return {
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        count,
        percentage: questions.length > 0 ? Math.round((count / questions.length) * 100) : 0
      }
    })
  }

  const calculateWeeklyStats = (attempts: any[]) => {
    const weeks = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      const weekAttempts = attempts.filter(a => {
        const attemptDate = new Date(a.completed_at)
        return attemptDate >= weekStart && attemptDate <= weekEnd
      })
      
      const scores = weekAttempts.map(a => a.score || 0)
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
      
      weeks.push({
        week: `Week ${7 - i}`,
        tests: weekAttempts.length,
        averageScore,
        totalTime: Math.round(weekAttempts.reduce((sum, a) => sum + (a.duration || 45), 0) / 60)
      })
    }
    
    return weeks
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/30 border-b-purple-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Analytics</h2>
          <p className="text-gray-300">Analyzing your performance data...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Analytics</h2>
          <p className="text-gray-300 mb-6">Unable to fetch your performance data</p>
          <Button onClick={fetchAnalyticsData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,198,0.1),transparent_50%)]"></div>
                
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        
        {/* Particle system */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-twinkle"
              style={{
                left: `${(i * 7.3) % 100}%`,
                top: `${(i * 11.7) % 100}%`,
                animationDelay: `${(i * 0.2) % 3}s`,
                animationDuration: `${2 + (i % 3)}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm rounded-2xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black text-white">
                    Analytics
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ml-3">
                      Dashboard
                    </span>
                  </h1>
                  <p className="text-xl text-gray-300">Deep insights into your learning journey</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
              {(['week', 'month', 'all'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  variant={selectedTimeframe === timeframe ? "default" : "ghost"}
                  className={`px-6 py-2 rounded-xl transition-all duration-300 ${
                    selectedTimeframe === timeframe
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Button>
              ))}
            </div>
            <Button 
              onClick={fetchAnalyticsData}
              disabled={refreshing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Tests */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl backdrop-blur-sm border border-blue-500/30">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {analytics.weeklyProgress > 0 ? `+${analytics.weeklyProgress}` : '0'} this week
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{analytics.totalTests}</div>
                  <div className="text-sm text-blue-400 font-medium">Total Tests</div>
                  <Progress value={(analytics.totalTests / 50) * 100} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Average Score */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl backdrop-blur-sm border border-green-500/30">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <Badge className={`${
                    analytics.averageScore >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    analytics.averageScore >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {analytics.averageScore >= 80 ? 'Excellent' : analytics.averageScore >= 60 ? 'Good' : 'Improving'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{analytics.averageScore}%</div>
                  <div className="text-sm text-green-400 font-medium">Average Score</div>
                  <Progress value={analytics.averageScore} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Study Time */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl backdrop-blur-sm border border-purple-500/30">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {selectedTimeframe}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{analytics.totalStudyTime}h</div>
                  <div className="text-sm text-purple-400 font-medium">Study Time</div>
                  <Progress value={(analytics.totalStudyTime / 100) * 100} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Study Streak */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl backdrop-blur-sm border border-orange-500/30">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    {analytics.studyStreak >= 7 ? 'On Fire!' : 'Keep Going!'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{analytics.studyStreak}</div>
                  <div className="text-sm text-orange-400 font-medium">Day Streak</div>
                  <Progress value={(analytics.studyStreak / 30) * 100} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Score Trends */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-white flex items-center">
                    <LineChart className="w-6 h-6 mr-2 text-blue-400" />
                    Performance Trends
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Improving
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analytics.scoreHistory.length > 0 ? (
                  <div className="space-y-6">
                    {/* Score Chart Visualization */}
                    <div className="h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl p-6 border border-blue-500/20">
                      <div className="flex items-end justify-between h-full space-x-2">
                        {analytics.scoreHistory.slice(-10).map((item, index) => (
                          <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                            <div 
                              className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-1000 hover:scale-105 cursor-pointer relative group"
                              style={{ 
                                height: `${(item.score / 100) * 100}%`,
                                minHeight: '8px',
                                animationDelay: `${index * 100}ms`
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.score}%
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                              Test {item.test}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Performance Stats - FIXED */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400">{analytics.bestScore}%</div>
                        <div className="text-sm text-gray-300">Best Score</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20">                        <div className="text-2xl font-bold text-blue-400">{analytics.averageScore}%</div>
                        <div className="text-sm text-gray-300">Average</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
                        <div className="text-2xl font-bold text-orange-400">{analytics.completionRate}%</div>
                        <div className="text-sm text-gray-300">Completion</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No performance data yet</p>
                      <p className="text-gray-500 text-sm">Take some tests to see your trends</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Completion Rate */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">Completion Rate</div>
                      <div className="text-sm text-gray-300">Tests finished</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{analytics.completionRate}%</div>
                </div>
                <Progress value={analytics.completionRate} className="h-3 bg-white/10" />
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">This Week</div>
                      <div className="text-sm text-gray-300">Tests taken</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-blue-400">{analytics.weeklyProgress}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Goal: 5 tests</span>
                    <span className="text-blue-400">{analytics.weeklyProgress}/5</span>
                  </div>
                  <Progress value={(analytics.weeklyProgress / 5) * 100} className="h-3 bg-white/10" />
                </div>
              </CardContent>
            </Card>

            {/* Study Insights */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-xl">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">AI Insights</div>
                    <div className="text-sm text-gray-300">Personalized tips</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {analytics.averageScore >= 80 ? (
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-green-400 mt-0.5" />
                      <p className="text-sm text-gray-300">Excellent performance! Try advanced topics.</p>
                    </div>
                  ) : analytics.averageScore >= 60 ? (
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-yellow-400 mt-0.5" />
                      <p className="text-sm text-gray-300">Good progress! Focus on weak areas.</p>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-400 mt-0.5" />
                      <p className="text-sm text-gray-300">Keep practicing! Consistency is key.</p>
                    </div>
                  )}
                  
                  {analytics.studyStreak >= 7 && (
                    <div className="flex items-start space-x-2">
                      <Trophy className="w-4 h-4 text-orange-400 mt-0.5" />
                      <p className="text-sm text-gray-300">Amazing streak! You're building great habits.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subject Performance & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Subject Performance */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <PieChart className="w-6 h-6 mr-2 text-emerald-400" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.subjectPerformance.length > 0 ? (
                <div className="space-y-4">
                  {analytics.subjectPerformance.map((subject, index) => (
                    <div 
                      key={subject.subject} 
                      className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          ></div>
                          <div>
                            <h4 className="font-semibold text-white">{subject.subject}</h4>
                            <p className="text-sm text-gray-300">{subject.testsCount} tests • {subject.timeSpent}h</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{subject.averageScore}%</div>
                          {subject.improvement !== 0 && (
                            <div className={`text-sm flex items-center ${
                              subject.improvement > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {subject.improvement > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(subject.improvement).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={subject.averageScore} 
                        className="h-2 bg-white/10"
                        style={{ 
                          '--progress-background': subject.color 
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No subject data available</p>
                    <p className="text-gray-500 text-sm">Take tests to see subject breakdown</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-blue-400" />
                  Recent Activity
                </CardTitle>
                <Link href="/dashboard/results">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl text-sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {analytics.recentActivity.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${
                            (activity.score || 0) >= 80 ? 'bg-green-500/20 border border-green-500/30' :
                            (activity.score || 0) >= 60 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                            'bg-red-500/20 border border-red-500/30'
                          }`}>
                            {(activity.score || 0) >= 80 ? (
                              <Trophy className="w-4 h-4 text-green-400" />
                            ) : (activity.score || 0) >= 60 ? (
                              <Star className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <Target className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">
                              {activity.tests?.title || 'Untitled Test'}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {new Date(activity.completed_at).toLocaleDateString()} • {activity.duration || 45}min
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{activity.score || 0}%</div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              (activity.score || 0) >= 80 ? 'border-green-500/30 text-green-400' :
                              (activity.score || 0) >= 60 ? 'border-yellow-500/30 text-yellow-400' :
                              'border-red-500/30 text-red-400'
                            }`}
                          >
                            {activity.tests?.subjects?.name || 'General'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No recent activity</p>
                    <p className="text-gray-500 text-sm">Start taking tests to see your activity</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Performance Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
                  Weekly Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.weeklyStats.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-64 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl p-6 border border-purple-500/20">
                      <div className="flex items-end justify-between h-full space-x-3">
                        {analytics.weeklyStats.map((week, index) => (
                          <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                            <div className="flex flex-col space-y-1 w-full">
                              {/* Tests bar - FIXED */}
                              <div 
                                className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-lg transition-all duration-1000 hover:scale-105 cursor-pointer relative group"
                                style={{ 
                                  height: `${Math.max((week.tests / 10) * 80, 4)}px`,
                                  animationDelay: `${index * 150}ms`
                                }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {week.tests} tests
                                </div>
                              </div>
                              {/* Score bar */}
                              <div 
                                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-lg transition-all duration-1000 hover:scale-105 cursor-pointer relative group"
                                style={{ 
                                  height: `${Math.max((week.averageScore / 100) * 60, 4)}px`,
                                  animationDelay: `${index * 150 + 75}ms`
                                }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {week.averageScore}% avg
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                              {week.week}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                        <span className="text-sm text-gray-300">Tests Taken</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                        <span className="text-sm text-gray-300">Average Score</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No weekly data available</p>
                      <p className="text-gray-500 text-sm">Take tests regularly to see trends</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Study Statistics */}
          <div className="space-y-6">
            {/* Difficulty Breakdown */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-yellow-400" />
                  Difficulty Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.difficultyBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.difficultyBreakdown.map((item, index) => (
                      <div key={item.difficulty} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">{item.difficulty}</span>
                          <span className="text-sm text-white font-medium">{item.count}</span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={item.percentage} 
                            className="h-2 bg-white/10"
                          />
                          <div 
                            className="absolute top-0 left-0 h-2 rounded-full transition-all duration-1000"
                            style={{
                              width: `${item.percentage}%`,
                              background: index === 0 ? 'linear-gradient(to right, #10B981, #059669)' :
                                         index === 1 ? 'linear-gradient(to right, #F59E0B, #D97706)' :
                                         'linear-gradient(to right, #EF4444, #DC2626)',
                              animationDelay: `${index * 200}ms`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No difficulty data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Progress */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-400" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Master */}
                  <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Trophy className={`w-4 h-4 ${analytics.totalTests >= 10 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span className="text-sm text-white">Test Master</span>
                      </div>
                      <span className="text-xs text-gray-300">{analytics.totalTests}/10</span>
                    </div>
                    <Progress value={(analytics.totalTests / 10) * 100} className="h-1 bg-white/10" />
                  </div>

                  {/* Score Excellence */}
                  <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Star className={`w-4 h-4 ${analytics.averageScore >= 80 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span className="text-sm text-white">Excellence</span>
                      </div>
                      <span className="text-xs text-gray-300">{analytics.averageScore}/80%</span>
                    </div>
                    <Progress value={(analytics.averageScore / 80) * 100} className="h-1 bg-white/10" />
                  </div>

                  {/* Streak Warrior */}
                  <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className={`w-4 h-4 ${analytics.studyStreak >= 7 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span className="text-sm text-white">Streak Warrior</span>
                      </div>
                      <span className="text-xs text-gray-300">{analytics.studyStreak}/7 days</span>
                    </div>
                    <Progress value={(analytics.studyStreak / 7) * 100} className="h-1 bg-white/10" />
                  </div>

                  {/* Study Time */}
                  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${analytics.totalStudyTime >= 20 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span className="text-sm text-white">Time Scholar</span>
                      </div>
                      <span className="text-xs text-gray-300">{analytics.totalStudyTime}/20h</span>
                    </div>
                    <Progress value={(analytics.totalStudyTime / 20) * 100} className="h-1 bg-white/10" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/dashboard/upload">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transform hover:scale-105 transition-all duration-300">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload New PDF
                    </Button>
                  </Link>
                  <Link href="/test/create">
                    <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl transform hover:scale-105 transition-all duration-300">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Create Test
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl transform hover:scale-105 transition-all duration-300"
                    onClick={() => {
                      // Export analytics data
                      const dataStr = JSON.stringify(analytics, null, 2)
                      const dataBlob = new Blob([dataStr], {type: 'application/json'})
                      const url = URL.createObjectURL(dataBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = 'analytics-data.json'
                      link.click()
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
                        