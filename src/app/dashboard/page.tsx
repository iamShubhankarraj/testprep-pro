'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Calendar,
  ArrowRight,
  Plus,
  BarChart3,
  Trophy,
  Star,
  Flame,
  ChevronRight,
  Activity,
  Upload,
  FileText,
  PieChart,
  LineChart,
  CheckCircle,
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  TrendingDown,
  Award,
  Brain,
  Sparkles,
  Rocket,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalTests: number
  totalQuestions: number
  averageScore: number
  studyStreak: number
  testsCompleted: number
  totalStudyTime: number
  totalPdfs: number
  weeklyProgress: number
}

interface RecentTest {
  id: string
  title: string
  score: number
  total_questions: number
  completed_at: string
  duration: number
  subject: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  created_at: string
}

interface TodoItem {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  due_date: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalQuestions: 0,
    averageScore: 0,
    studyStreak: 0,
    testsCompleted: 0,
    totalStudyTime: 0,
    totalPdfs: 0,
    weeklyProgress: 0
  })
  
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchDashboardData()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile({
          ...profile,
          email: user.email || ''
        })
      }

      // Fetch real stats
      const [testsResult, questionsResult, pdfsResult, attemptsResult] = await Promise.all([
        supabase.from('tests').select('id').eq('user_id', user.id),
        supabase.from('questions').select('id').eq('user_id', user.id),
        supabase.from('pdfs').select('id').eq('user_id', user.id),
        supabase.from('test_attempts').select('score, completed_at, test_id').eq('user_id', user.id).order('completed_at', { ascending: false })
      ])

      // Calculate real statistics
      const totalTests = testsResult.data?.length || 0
      const totalQuestions = questionsResult.data?.length || 0
      const totalPdfs = pdfsResult.data?.length || 0
      const attempts = attemptsResult.data || []
      
      const completedTests = attempts.filter(a => a.score !== null).length
      const averageScore = attempts.length > 0 
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
        : 0

      // Calculate study streak (simplified)
      const studyStreak = calculateStudyStreak(attempts)
      
      // Calculate weekly progress
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      const weeklyAttempts = attempts.filter(a => new Date(a.completed_at) > weekStart)
      const weeklyProgress = weeklyAttempts.length

      setStats({
        totalTests,
        totalQuestions,
        averageScore,
        studyStreak,
        testsCompleted: completedTests,
        totalStudyTime: Math.round(completedTests * 45 / 60), // Estimated
        totalPdfs,
        weeklyProgress
      })

      // Fetch recent tests with details
      const { data: recentTestsData } = await supabase
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
            subjects (name)
          )
        `)
        .eq('user_id', user.id)
        .not('score', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5)

      if (recentTestsData) {
        const formattedTests = recentTestsData.map(attempt => {
          // Handle tests as object or array (Supabase can return either)
          const testObj = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
          return {
            id: attempt.id,
            title: testObj?.title || 'Untitled Test',
            score: attempt.score || 0,
            total_questions: testObj?.total_questions || 0,
            completed_at: attempt.completed_at,
            duration: attempt.duration || 45,
            subject: Array.isArray(testObj?.subjects) && testObj.subjects.length > 0
              ? testObj.subjects[0].name
              : 'General'
          }
        });
        setRecentTests(formattedTests);
      }

      // Fetch todos (you'll need to create this table)
      const { data: todosData } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (todosData) {
        setTodos(todosData)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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
        a.completed_at && a.completed_at.split('T')[0] === dateStr  // ← Added null check
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Dashboard</h2>
          <p className="text-gray-300">Preparing your personalized experience...</p>
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
          {[...Array(30)].map((_, i) => (
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
        {/* Header with Profile */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {userProfile?.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black text-white mb-1">
                    Welcome back, 
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block lg:inline lg:ml-3">
                      {userProfile?.full_name?.split(' ')[0] || 'Student'}! 👋
                    </span>
                  </h1>
                  <p className="text-xl text-gray-300">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <p className="text-xl text-gray-300 max-w-2xl">
                Ready to continue your learning journey? Let&apos;s make today count!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setShowProfile(!showProfile)}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl"
              >
                <User className="w-5 h-5 mr-2" />
                Profile
              </Button>
              <Link href="/dashboard/upload">
                <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload PDF
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-4 top-24 z-50 w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl animate-fade-in">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {userProfile?.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{userProfile?.full_name}</h3>
                <p className="text-gray-300 text-sm">{userProfile?.email}</p>
                <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                  Premium Member
                </Badge>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white hover:bg-white/10 rounded-xl"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Account Settings
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white hover:bg-white/10 rounded-xl"
                >
                  <Bell className="w-4 h-4 mr-3" />
                  Notifications
                </Button>
                <div className="border-t border-white/10 pt-3">
                  <Button 
                    onClick={handleSignOut}
                    variant="ghost" 
                    className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                  <div className="text-right">
                    <div className="text-3xl font-black text-white mb-1">{stats.totalTests}</div>
                    <div className="text-sm text-blue-400 font-medium">Total Tests</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 font-medium">+{stats.weeklyProgress} this week</span>
                </div>
                <Progress value={(stats.totalTests / 20) * 100} className="mt-3 h-2 bg-white/10" />
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
                    <Trophy className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white mb-1">{stats.averageScore}%</div>
                    <div className="text-sm text-green-400 font-medium">Average Score</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 font-medium">Excellent performance</span>
                </div>
                <Progress value={stats.averageScore} className="mt-3 h-2 bg-white/10" />
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
                    <Flame className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white mb-1">{stats.studyStreak}</div>
                    <div className="text-sm text-orange-400 font-medium">Day Streak</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Flame className="w-4 h-4 text-orange-400 mr-1" />
                  <span className="text-orange-400 font-medium">Keep it burning!</span>
                </div>
                <Progress value={(stats.studyStreak / 30) * 100} className="mt-3 h-2 bg-white/10" />
              </div>
            </div>
          </Card>

          {/* Total Questions */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl backdrop-blur-sm border border-purple-500/30">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white mb-1">{stats.totalQuestions}</div>
                    <div className="text-sm text-purple-400 font-medium">Questions</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400 mr-1" />
                  <span className="text-purple-400 font-medium">Knowledge base</span>
                </div>
                <Progress value={(stats.totalQuestions / 1000) * 100} className="mt-3 h-2 bg-white/10" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Rocket className="w-6 h-6 mr-2 text-yellow-400" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Jump into your learning activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/dashboard/upload">
                  <div className="group p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer transform hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-white">Upload PDF</h4>
                          <p className="text-sm text-gray-300">Create tests from documents</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
                    </div>
                  </div>
                </Link>

                <Link href="/test/create">
                  <div className="group p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer transform hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                            <Plus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-white">Create Test</h4>
                          <p className="text-sm text-gray-300">Build custom assessments</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors duration-300" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/tests">
                  <div className="group p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer transform hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-white">My Tests</h4>
                          <p className="text-sm text-gray-300">View all your tests</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/analytics">
                  <div className="group p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer transform hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-white">Analytics</h4>
                          <p className="text-sm text-gray-300">Track your progress</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-300" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/todo">
                  <div className="group p-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl border border-teal-500/20 hover:border-teal-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 cursor-pointer transform hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-teal-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-white">To-Do List</h4>
                          <p className="text-sm text-gray-300">Manage study tasks</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2 text-xs bg-teal-500/20 text-teal-400 border-teal-500/30">
                          {todos.filter(t => !t.completed).length} pending
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Enhanced Calendar Widget */}
                <div className="group p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-2xl border border-rose-500/20 hover:border-rose-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/20 cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-rose-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <div className="relative bg-gradient-to-br from-rose-500 to-rose-600 p-3 rounded-xl">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold text-white">Study Calendar</h4>
                        <p className="text-sm text-gray-300">Today&apos;s schedule</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-rose-500/20">
                    <div className="text-center mb-2">
                      <p className="text-sm font-semibold text-white">
                        {currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs mb-3">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={`day-${index}`} className="text-center text-gray-400 font-medium p-1">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 35 }, (_, i) => {
                        const date = new Date();
                        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                        const startDate = new Date(firstDay);
                        startDate.setDate(startDate.getDate() - firstDay.getDay());
                        const currentDate = new Date(startDate);
                        currentDate.setDate(currentDate.getDate() + i);
                        const isToday = currentDate.toDateString() === new Date().toDateString();
                        const isCurrentMonth = currentDate.getMonth() === date.getMonth();
                        
                        return (
                          <div
                            key={`date-${i}`}
                            className={`text-center p-1 rounded text-xs cursor-pointer transition-all duration-200 ${
                              isToday
                                ? 'bg-rose-500 text-white font-bold shadow-lg'
                                : isCurrentMonth
                                ? 'text-gray-300 hover:bg-rose-500/20'
                                : 'text-gray-600'
                            }`}
                          >
                            {currentDate.getDate()}
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <span>Physics Test - 2:00 PM</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span>Study Session - 4:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white flex items-center">
                      <Activity className="w-6 h-6 mr-2 text-blue-400" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Your latest test performances
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/results">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentTests.length > 0 ? (
                  <div className="space-y-4">
                    {recentTests.map((test, index) => (
                      <div 
                        key={test.id} 
                        className="group p-6 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 transform hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className={`absolute inset-0 rounded-xl blur-md opacity-30 ${
                                test.score >= 80 ? 'bg-green-500' : test.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <div className={`relative p-3 rounded-xl ${
                                test.score >= 80 ? 'bg-gradient-to-br from-green-500 to-green-600' : 
                                test.score >= 60 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 
                                'bg-gradient-to-br from-red-500 to-red-600'
                              }`}>
                                {test.score >= 80 ? (
                                  <Trophy className="w-5 h-5 text-white" />
                                ) : test.score >= 60 ? (
                                  <Star className="w-5 h-5 text-white" />
                                ) : (
                                  <Target className="w-5 h-5 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="font-semibold text-white text-lg">{test.title}</h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-300">
                                  Score: <span className="font-semibold text-white">{test.score}%</span>
                                </p>
                                <p className="text-sm text-gray-300">
                                  Questions: {test.total_questions}
                                </p>
                                <p className="text-sm text-gray-300">
                                  Duration: {test.duration}m
                                </p>
                                <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                                  {test.subject}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={test.score >= 80 ? "default" : test.score >= 60 ? "secondary" : "destructive"} 
                              className={`mb-2 ${
                                test.score >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                test.score >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-red-500/20 text-red-400 border-red-500/30'
                              }`}
                            >
                              {test.score >= 80 ? "Excellent" : test.score >= 60 ? "Good" : "Needs Work"}
                            </Badge>
                            <p className="text-sm text-gray-400">
                              {new Date(test.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-300 mb-2">
                            <span>Performance</span>
                            <span>{test.score}%</span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={test.score} 
                              className="h-3 bg-white/10 rounded-full overflow-hidden"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-8 rounded-full border border-blue-500/30">
                        <BookOpen className="w-16 h-16 text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No tests taken yet</h3>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                      Start your learning journey by taking your first test! Upload a PDF or create a custom test to begin.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link href="/dashboard/upload">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transform hover:scale-105 transition-all duration-300">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload PDF
                        </Button>
                      </Link>
                      <Link href="/test/create">
                        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-xl transform hover:scale-105 transition-all duration-300">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Test
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Analytics & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Analytics */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <LineChart className="w-6 h-6 mr-2 text-emerald-400" />
                Performance Analytics
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your learning progress insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Score Distribution */}
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">Score Distribution</h4>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Trending Up
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Excellent (80-100%)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${(recentTests.filter(t => t.score >= 80).length / Math.max(recentTests.length, 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-white font-medium">{recentTests.filter(t => t.score >= 80).length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Good (60-79%)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: `${(recentTests.filter(t => t.score >= 60 && t.score < 80).length / Math.max(recentTests.length, 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-white font-medium">{recentTests.filter(t => t.score >= 60 && t.score < 80).length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Needs Work (0-59%)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full" style={{ width: `${(recentTests.filter(t => t.score < 60).length / Math.max(recentTests.length, 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-white font-medium">{recentTests.filter(t => t.score < 60).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Study Insights */}
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                  <h4 className="font-semibold text-white mb-3">Study Insights</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-sm text-gray-300">Average Study Time</span>
                      </div>
                      <span className="text-sm text-white font-medium">{stats.totalStudyTime}h this month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-sm text-gray-300">Completion Rate</span>
                      </div>
                      <span className="text-sm text-white font-medium">{Math.round((stats.testsCompleted / Math.max(stats.totalTests, 1)) * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-sm text-gray-300">PDFs Processed</span>
                      </div>
                      <span className="text-sm text-white font-medium">{stats.totalPdfs} documents</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl border border-indigo-500/20 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{stats.weeklyProgress}</div>
                    <div className="text-xs text-gray-300">Tests This Week</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl border border-pink-500/20 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{Math.round(stats.averageScore)}%</div>
                    <div className="text-xs text-gray-300">Best Score</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations & Goals */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <Brain className="w-6 h-6 mr-2 text-violet-400" />
                AI Recommendations
              </CardTitle>
              <CardDescription className="text-gray-300">
                Personalized insights to boost your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* AI Insights */}
                <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20">
                  <div className="flex items-center mb-3">
                    <Sparkles className="w-5 h-5 text-violet-400 mr-2" />
                    <h4 className="font-semibold text-white">Smart Insights</h4>
                  </div>
                  <div className="space-y-3">
                    {stats.averageScore >= 80 ? (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                        <p className="text-sm text-gray-300">Excellent performance! Consider taking more advanced tests to challenge yourself.</p>
                      </div>
                    ) : stats.averageScore >= 60 ? (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 animate-pulse"></div>
                        <p className="text-sm text-gray-300">Good progress! Focus on your weak areas to reach the next level.</p>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                        <p className="text-sm text-gray-300">Keep practicing! Consistent study will improve your scores significantly.</p>
                      </div>
                    )}
                    
                    {stats.studyStreak >= 7 ? (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 animate-pulse"></div>
                        <p className="text-sm text-gray-300">Amazing streak! You&apos;re building excellent study habits.</p>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
                        <p className="text-sm text-gray-300">Try to study daily to build momentum and improve retention.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goals & Targets */}
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">Weekly Goals</h4>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {Math.round((stats.weeklyProgress / 5) * 100)}% Complete
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Take 5 tests</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(stats.weeklyProgress / 5) * 100} className="w-16 h-2 bg-white/10" />
                        <span className="text-sm text-white">{stats.weeklyProgress}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Maintain 80% average</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={Math.min((stats.averageScore / 80) * 100, 100)} className="w-16 h-2 bg-white/10" />
                        <span className="text-sm text-white">{stats.averageScore}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">7-day study streak</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={Math.min((stats.studyStreak / 7) * 100, 100)} className="w-16 h-2 bg-white/10" />
                        <span className="text-sm text-white">{stats.studyStreak}/7</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/20">
                  <div className="flex items-center mb-3">
                    <Award className="w-5 h-5 text-yellow-400 mr-2" />
                    <h4 className="font-semibold text-white">Recent Achievements</h4>
                  </div>
                  <div className="space-y-2">
                    {stats.studyStreak >= 7 && (
                      <div className="flex items-center space-x-3 p-2 bg-orange-500/10 rounded-lg">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-gray-300">Week Warrior - 7 day streak!</span>
                      </div>
                    )}
                    {stats.averageScore >= 80 && (
                      <div className="flex items-center space-x-3 p-2 bg-green-500/10 rounded-lg">
                        <Trophy className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Excellence - 80%+ average</span>
                      </div>
                    )}
                    {stats.totalTests >= 10 && (
                      <div className="flex items-center space-x-3 p-2 bg-blue-500/10 rounded-lg">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Test Master - 10+ tests completed</span>
                      </div>
                    )}
                    {stats.totalTests === 0 && (
                      <div className="text-center py-4">
                        <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Complete tests to unlock achievements!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s infinite; }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-gradient-shift { 
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite; 
        }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.5s ease-out; }
        .animate-rotate-slow { animation: rotate-slow 20s linear infinite; }
        
        /* Hover effects */
        .hover-lift:hover { transform: translateY(-8px) scale(1.02); }
        .hover-glow:hover { 
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 
                      0 0 0 1px rgba(255, 255, 255, 0.1),
                      0 0 40px rgba(59, 130, 246, 0.3); 
        }
        
        /* Glass morphism enhanced */
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: rgba(255, 255, 255, 0.1); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(to bottom, #2563eb, #7c3aed); 
        }
        
        /* Particle effects */
        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        
        /* Loading states */
        .skeleton {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.1) 25%, 
            rgba(255, 255, 255, 0.2) 50%, 
            rgba(255, 255, 255, 0.1) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        /* Interactive elements */
        .interactive-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        
        .interactive-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .interactive-card:active {
          transform: translateY(-2px) scale(1.01);
        }
        
        /* Notification animations */
        @keyframes notification-slide {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        .notification-enter {
          animation: notification-slide 0.3s ease-out;
        }
        
        /* Progress bar enhancements */
        .progress-bar {
          position: relative;
          overflow: hidden;
        }
        
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
        }
        
        /* Card hover states */
        .stat-card {
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s;
        }
        
        .stat-card:hover::before {
          left: 100%;
        }
        
        /* Responsive animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Focus states for accessibility */
        .focus-ring:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Dark mode enhancements */
        .dark-glass {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Micro-interactions */
        .micro-bounce:hover {
          animation: micro-bounce 0.3s ease-in-out;
        }
        
        @keyframes micro-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        /* Loading spinner variations */
        .spinner-dual {
          border: 4px solid rgba(59, 130, 246, 0.3);
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Text animations */
        .text-glow {
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        .text-glow:hover {
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
        }
        
        /* Button enhancements */
        .btn-premium {
          position: relative;
          overflow: hidden;
        }
        
        .btn-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }
        
        .btn-premium:hover::before {
          left: 100%;
        }
        
        /* Achievement badges */
        .achievement-badge {
          position: relative;
          animation: achievement-glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes achievement-glow {
          0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
          100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
        }
        
        /* Calendar enhancements */
        .calendar-day {
          transition: all 0.2s ease;
        }
        
        .calendar-day:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.1);
        }
        
        .calendar-today {
          animation: pulse-today 2s ease-in-out infinite;
        }
        
        @keyframes pulse-today {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}