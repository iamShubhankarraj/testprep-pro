'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Clock,
  Plus,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  Filter,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Star,
  Zap,
  ChevronRight,
  Eye,
  Download,
  Share2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Interfaces matching your Supabase table structures
interface UserProfile {
  id: string
  email: string
  full_name: string | null
}

interface TestDefinition {
  id: string;
  user_id: string; // The ID of the user who created this test definition
  title: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'mixed';
  test_type: 'practice' | 'mock' | 'custom';
  subjects: string[] | null; // Array of subject names
  created_at: string;
  is_active: boolean;
}

interface TestAttempt {
  id: string;
  user_id: string;
  test_id: string;
  started_at: string;
  completed_at: string | null;
  time_taken_minutes: number | null;
  total_questions: number;
  attempted_questions: number;
  correct_answers: number | null;
  incorrect_answers: number | null;
  score: number | null; // DECIMAL(5,2) from DB, so number in TS
  raw_score: number | null;
  max_possible_score: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  // Supabase join will put test definition data under 'tests' key
  tests?: TestDefinition; // Joined test definition
}

interface PerformanceAnalytics {
  id: string;
  user_id: string;
  subject_id: number | null;
  topic_id: number | null;
  total_questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_time_per_question: number;
  strength_level: 'weak' | 'average' | 'strong';
  last_updated: string;
  created_at: string;
  // You might join subjects/topics here if you want their names
  subjects?: { name: string }; // Example if joining subjects table
  topics?: { name: string }; // Example if joining topics table
  tests_taken?: number; // Assuming this might be part of analytics later
  improvement_percentage?: number; // Assuming this might be part of analytics later
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableTests, setAvailableTests] = useState<TestDefinition[]>([])
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([])
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true)
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (!supabaseUser) {
        router.push('/auth/login')
        setLoading(false)
        return
      }

      // 1. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', supabaseUser.id)
        .single()

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError)
        // Fallback for new users or profile not yet created
        setUser({ id: supabaseUser.id, email: supabaseUser.email || '', full_name: supabaseUser.user_metadata?.full_name || 'Student' })
      } else {
        setUser({ id: supabaseUser.id, email: profile.email || supabaseUser.email || '', full_name: profile.full_name || 'Student' })
      }

      // 2. Fetch all available test definitions (from 'tests' table)
      // IMPORTANT: Ensure your RLS policy on 'public.tests' allows SELECT for authenticated users.
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .order('title', { ascending: true });

      if (testsError) {
        console.error('Error fetching available tests:', testsError);
      } else {
        setAvailableTests(testsData as TestDefinition[]);
      }

      // 3. Fetch user's test attempts (from 'test_attempts' table)
      // Joining 'tests' table to get test definition details for each attempt
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('test_attempts')
        .select(`
          *,
          tests (title, duration_minutes, difficulty_level, subjects)
        `)
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

      if (attemptsError) {
        console.error('Error fetching test attempts:', attemptsError);
      } else {
        setTestAttempts(attemptsData as TestAttempt[]);
      }

      // 4. Fetch performance analytics (from 'performance_analytics' table)
      // Joining 'subjects' table to get subject names
      const { data: performanceData, error: performanceError } = await supabase
        .from('performance_analytics')
        .select(`
          *,
          subjects (name)
        `)
        .eq('user_id', supabaseUser.id)
        .order('subject_id', { ascending: true }); // Order by subject for consistent display

      if (performanceError) {
        console.error('Error fetching performance analytics:', performanceError);
      } else {
        setPerformanceAnalytics(performanceData as PerformanceAnalytics[]);
      }

      setLoading(false)
    }

    initDashboard()
  }, [router])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      case 'mixed': return 'bg-blue-100 text-blue-800' // For mixed difficulty
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A';
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
  }

  // Filter available tests (definitions) based on search and subject
  const filteredAvailableTests = availableTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase())
    // Check if the test's subjects array includes the selected subject
    const matchesSubject = selectedSubject === 'All' || (test.subjects && test.subjects.includes(selectedSubject))
    return matchesSearch && matchesSubject
  })

  const completedTests = testAttempts.filter(attempt => attempt.status === 'completed')
  const averageScore = completedTests.length > 0
    ? Math.round(completedTests.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedTests.length)
    : 0

  const totalStudyTime = completedTests.reduce((sum, attempt) => sum + (attempt.time_taken_minutes || 0), 0)
  const totalQuestionsAttemptedOverall = completedTests.reduce((sum, attempt) => sum + (attempt.total_questions || 0), 0)
  const correctAnswersOverall = completedTests.reduce((sum, attempt) => sum + (attempt.correct_answers || 0), 0)
  const accuracyRate = totalQuestionsAttemptedOverall > 0 ? Math.round((correctAnswersOverall / totalQuestionsAttemptedOverall) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Should redirect to login by checkUser, but good to have
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MathOnGo</h1>
                <p className="text-sm text-gray-300">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-300 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                {/* <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span> */}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">{user?.full_name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.full_name}! 👋
          </h2>
          <p className="text-gray-300">
            Your test preparation journey continues with AI-powered insights
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Tests Completed</p>
                  <p className="text-2xl font-bold text-white">{completedTests.length}</p>
                  <p className="text-xs text-green-400">
                    {completedTests.length > 0 ? `+${completedTests.length} total` : 'No tests yet'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Average Score</p>
                  <p className="text-2xl font-bold text-white">{averageScore}%</p>
                  <p className="text-xs text-green-400">
                    {averageScore > 0 ? `Good progress!` : 'Take a test to see score'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Study Time</p>
                  <p className="text-2xl font-bold text-white">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</p>
                  <p className="text-xs text-blue-400">
                    Overall study time
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-white">{accuracyRate}%</p>
                  <p className="text-xs text-yellow-400">
                    {accuracyRate > 0 ? `Keep it up!` : 'Attempt questions to see accuracy'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl p-1">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20 data-[state=active]:shadow-md rounded-lg px-4 py-2 transition-all duration-200">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-white data-[state=active]:bg-white/20 data-[state=active]:shadow-md rounded-lg px-4 py-2 transition-all duration-200">
              Tests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20 data-[state=active]:shadow-md rounded-lg px-4 py-2 transition-all duration-200">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white/20 data-[state=active]:shadow-md rounded-lg px-4 py-2 transition-all duration-200">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Performance Chart */}
              <div className="lg:col-span-2">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Overview</CardTitle>
                    <CardDescription className="text-gray-300">
                      Your progress across all subjects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceAnalytics.length > 0 ? (
                        performanceAnalytics.map((pa) => (
                          <div key={pa.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{pa.subjects?.name ? pa.subjects.name[0] : 'N/A'}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{pa.subjects?.name || 'Unknown Subject'}</h3>
                                <p className="text-sm text-gray-400">{pa.total_questions_attempted} questions attempted</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getScoreColor(pa.accuracy_percentage)}`}>
                                {pa.accuracy_percentage}%
                              </p>
                              {/* Assuming improvement_percentage might be calculated later */}
                              {/* {pa.improvement_percentage > 0 && (
                                <p className="text-xs text-green-400">+{pa.improvement_percentage}%</p>
                              )} */}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center">No performance data yet. Take some tests!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/test/create">
                      <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test
                      </Button>
                    </Link>
                    <Link href="/dashboard/upload">
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                        <FileText className="w-4 h-4 mr-2" />
                        Upload PDF
                      </Button>
                    </Link>
                    <Link href="/dashboard/analytics">
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </Link>
                    <Link href="/dashboard/achievements">
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Achievements
                      </Button>
                    </Link>
                    <Link href="/dashboard/todo">
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        View Todo List
                      </Button>
                    </Link>
                    <Link href="/dashboard/results">
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/20 hover:text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                        <BarChart3 className="w-4 h-4 mr-2" /> {/* Reusing BarChart3 for results */}
                        View Results
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {completedTests.length > 0 ? (
                        completedTests.slice(0, 3).map((attempt) => (
                          <div key={attempt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                            <div>
                              <h4 className="font-medium text-white text-sm">{attempt.tests?.title || 'Unknown Test'}</h4>
                              <p className="text-xs text-gray-400">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${getScoreColor(attempt.score)}`}>
                                {attempt.score}%
                              </p>
                              <Badge className={getDifficultyColor(attempt.tests?.difficulty_level || 'medium')}>
                                {attempt.tests?.difficulty_level || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center">No recent test activity.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Available Tests</CardTitle>
                    <CardDescription className="text-gray-300">
                      Continue your preparation with these tests
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 w-64 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Subjects</option>
                      {/* These options should ideally be fetched dynamically from your 'subjects' table */}
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAvailableTests.length > 0 ? (
                    filteredAvailableTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors shadow-sm hover:shadow-md">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{test.title}</h3>
                            <div className="flex items-center space-x-2 mt-2">
                              {Array.isArray(test.subjects) && test.subjects.length > 0 && (
                                <Badge variant="secondary" className="bg-white/10 text-gray-300 border-white/20">
                                  {test.subjects.join(', ')} {/* Display subjects */}
                                </Badge>
                              )}
                              <Badge className={getDifficultyColor(test.difficulty_level)}>
                                {test.difficulty_level}
                              </Badge>
                              <span className="text-gray-400 text-sm">• {test.duration_minutes} min</span>
                              <span className="text-gray-400 text-sm">• {test.total_questions} questions</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Link href={`/test/${test.id}/start`}> {/* Link to the test taking page */}
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-xl text-md font-semibold shadow-md hover:shadow-lg transition-all duration-300">
                              <Play className="w-4 h-4 mr-2" />
                              Start Test
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 rounded-xl shadow-sm hover:shadow-md">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center p-6">No available tests matching your criteria.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subject Performance Chart */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Subject Performance</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your scores across different subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceAnalytics.length > 0 ? (
                      performanceAnalytics.map((pa) => (
                        <div key={pa.id} className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-white">{pa.subjects?.name || 'Unknown'}</span>
                            <span className="text-gray-300">{pa.accuracy_percentage}%</span>
                          </div>
                          <Progress value={pa.accuracy_percentage} className="h-2 bg-white/20" />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center">No subject performance data. Complete some tests!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test History */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Test History</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your recent test performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedTests.length > 0 ? (
                      completedTests.map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <h4 className="font-medium text-white">{attempt.tests?.title || 'Unknown Test'}</h4>
                            <p className="text-sm text-gray-400">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getScoreColor(attempt.score)}`}>
                              {attempt.score}% ({getScoreGrade(attempt.score)})
                            </p>
                            <p className="text-xs text-gray-400">
                              {attempt.time_taken_minutes !== null && attempt.tests?.duration_minutes !== null ? `${attempt.time_taken_minutes}min / ${attempt.tests?.duration_minutes}min` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center">No test history available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Placeholder Achievements - You'd fetch these from a database if implemented */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">First Test Completed!</h3>
                  <p className="text-gray-300 text-sm">
                    {completedTests.length > 0 ? 'Achieved!' : 'Complete your first test to earn this!'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Learning Streak</h3>
                  <p className="text-gray-300 text-sm">
                    Keep studying consistently! (Requires custom logic)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Subject Master</h3>
                  <p className="text-gray-300 text-sm">
                    {performanceAnalytics.some(p => p.accuracy_percentage >= 90) ? 'Achieved 90%+ in a subject!' : 'Achieve 90%+ in any subject!'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
