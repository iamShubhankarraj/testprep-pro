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
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface User {
  id: string
  email: string
  full_name: string
}

interface Test {
  id: string
  title: string
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  duration: number
  questions: number
  completed: boolean
  score?: number
  date?: string
  timeSpent?: number
  correctAnswers?: number
  totalQuestions?: number
}

interface PerformanceData {
  subject: string
  score: number
  testsTaken: number
  improvement: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<Test[]>([])
  const [recentTests, setRecentTests] = useState<Test[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Student'
      })
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadData = () => {
    // Load comprehensive test data
    const mockTests: Test[] = [
      {
        id: '1',
        title: 'JEE Main Physics - Mechanics',
        subject: 'Physics',
        difficulty: 'Medium',
        duration: 60,
        questions: 25,
        completed: true,
        score: 85,
        date: '2024-01-15',
        timeSpent: 52,
        correctAnswers: 21,
        totalQuestions: 25
      },
      {
        id: '2',
        title: 'NEET Chemistry - Organic',
        subject: 'Chemistry',
        difficulty: 'Hard',
        duration: 45,
        questions: 20,
        completed: true,
        score: 72,
        date: '2024-01-14',
        timeSpent: 43,
        correctAnswers: 14,
        totalQuestions: 20
      },
      {
        id: '3',
        title: 'JEE Advanced Mathematics',
        subject: 'Mathematics',
        difficulty: 'Hard',
        duration: 90,
        questions: 30,
        completed: true,
        score: 68,
        date: '2024-01-13',
        timeSpent: 87,
        correctAnswers: 20,
        totalQuestions: 30
      },
      {
        id: '4',
        title: 'NEET Biology - Botany',
        subject: 'Biology',
        difficulty: 'Easy',
        duration: 30,
        questions: 15,
        completed: true,
        score: 93,
        date: '2024-01-12',
        timeSpent: 25,
        correctAnswers: 14,
        totalQuestions: 15
      },
      {
        id: '5',
        title: 'JEE Main Chemistry - Physical',
        subject: 'Chemistry',
        difficulty: 'Medium',
        duration: 60,
        questions: 25,
        completed: false
      },
      {
        id: '6',
        title: 'NEET Physics - Optics',
        subject: 'Physics',
        difficulty: 'Hard',
        duration: 45,
        questions: 20,
        completed: false
      }
    ]

    const mockPerformance: PerformanceData[] = [
      { subject: 'Physics', score: 78, testsTaken: 8, improvement: 12 },
      { subject: 'Chemistry', score: 82, testsTaken: 6, improvement: 8 },
      { subject: 'Mathematics', score: 71, testsTaken: 10, improvement: 15 },
      { subject: 'Biology', score: 89, testsTaken: 4, improvement: 5 }
    ]

    setTests(mockTests)
    setRecentTests(mockTests.filter(test => test.completed).slice(0, 5))
    setPerformanceData(mockPerformance)
  }

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
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
  }

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === 'All' || test.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const completedTests = tests.filter(test => test.completed)
  const averageScore = completedTests.length > 0 
    ? Math.round(completedTests.reduce((sum, test) => sum + (test.score || 0), 0) / completedTests.length)
    : 0

  const totalStudyTime = completedTests.reduce((sum, test) => sum + (test.timeSpent || 0), 0)
  const totalQuestions = completedTests.reduce((sum, test) => sum + (test.totalQuestions || 0), 0)
  const correctAnswers = completedTests.reduce((sum, test) => sum + (test.correctAnswers || 0), 0)
  const accuracyRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null
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
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
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
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Tests Completed</p>
                  <p className="text-2xl font-bold text-white">{completedTests.length}</p>
                  <p className="text-xs text-green-400">+2 this week</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Average Score</p>
                  <p className="text-2xl font-bold text-white">{averageScore}%</p>
                  <p className="text-xs text-green-400">+5% improvement</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Study Time</p>
                  <p className="text-2xl font-bold text-white">{Math.round(totalStudyTime / 60)}h</p>
                  <p className="text-xs text-blue-400">This month</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-white">{accuracyRate}%</p>
                  <p className="text-xs text-yellow-400">+3% this week</p>
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
          <TabsList className="bg-white/10 backdrop-blur-xl border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-white data-[state=active]:bg-white/20">
              Tests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white/20">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Performance Chart */}
              <div className="lg:col-span-2">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Overview</CardTitle>
                    <CardDescription className="text-gray-300">
                      Your progress across all subjects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceData.map((subject) => (
                        <div key={subject.subject} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{subject.subject[0]}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{subject.subject}</h3>
                              <p className="text-sm text-gray-400">{subject.testsTaken} tests taken</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getScoreColor(subject.score)}`}>
                              {subject.score}%
                            </p>
                            <p className="text-xs text-green-400">+{subject.improvement}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/test/create">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test
                      </Button>
                    </Link>
                    <Link href="/dashboard/upload">
                      <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <FileText className="w-4 h-4 mr-2" />
                        Upload PDF
                      </Button>
                    </Link>
                    <Link href="/dashboard/analytics">
                      <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentTests.slice(0, 3).map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white text-sm">{test.title}</h4>
                            <p className="text-xs text-gray-400">{test.date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${getScoreColor(test.score || 0)}`}>
                              {test.score}%
                            </p>
                            <Badge className={getDifficultyColor(test.difficulty)}>
                              {test.difficulty}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
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
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 w-64"
                      />
                    </div>
                    <select 
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                    >
                      <option value="All">All Subjects</option>
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
                  {filteredTests.filter(test => !test.completed).map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{test.title}</h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary" className="bg-white/10 text-gray-300">
                              {test.subject}
                            </Badge>
                            <Badge className={getDifficultyColor(test.difficulty)}>
                              {test.difficulty}
                            </Badge>
                            <span className="text-gray-400 text-sm">• {test.duration} min</span>
                            <span className="text-gray-400 text-sm">• {test.questions} questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/test/${test.id}`}>
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Play className="w-4 h-4 mr-2" />
                            Start Test
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Chart */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Subject Performance</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your scores across different subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.map((subject) => (
                      <div key={subject.subject} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{subject.subject}</span>
                          <span className="text-gray-300">{subject.score}%</span>
                        </div>
                        <Progress value={subject.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Test History */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Test History</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your recent test performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="font-medium text-white">{test.title}</h4>
                          <p className="text-sm text-gray-400">{test.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getScoreColor(test.score || 0)}`}>
                            {test.score}% ({getScoreGrade(test.score || 0)})
                          </p>
                          <p className="text-xs text-gray-400">
                            {test.timeSpent}min / {test.duration}min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Perfect Score</h3>
                  <p className="text-gray-300 text-sm">Achieved 100% in Biology test</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Speed Demon</h3>
                  <p className="text-gray-300 text-sm">Completed test in 25 minutes</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Consistent Learner</h3>
                  <p className="text-gray-300 text-sm">7-day study streak achieved</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
