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
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalTests: number
  totalQuestions: number
  averageScore: number
  studyStreak: number
  testsCompleted: number
  totalStudyTime: number
}

interface RecentTest {
  id: string
  title: string
  score: number
  totalQuestions: number
  completedAt: string
  duration: number
}

interface UpcomingTest {
  id: string
  title: string
  scheduledFor: string
  difficulty: string
  questionCount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalQuestions: 0,
    averageScore: 0,
    studyStreak: 0,
    testsCompleted: 0,
    totalStudyTime: 0
  })
  
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Student')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0])
      }

      // Mock data for demonstration - replace with actual queries
      setStats({
        totalTests: 12,
        totalQuestions: 450,
        averageScore: 78,
        studyStreak: 7,
        testsCompleted: 8,
        totalStudyTime: 24
      })

      setRecentTests([
        {
          id: '1',
          title: 'Physics Chapter 1',
          score: 85,
          totalQuestions: 25,
          completedAt: '2024-01-15',
          duration: 45
        },
        {
          id: '2',
          title: 'Mathematics Algebra',
          score: 72,
          totalQuestions: 30,
          completedAt: '2024-01-14',
          duration: 60
        }
      ])

      setUpcomingTests([
        {
          id: '3',
          title: 'Chemistry Organic',
          scheduledFor: '2024-01-20',
          difficulty: 'Hard',
          questionCount: 40
        }
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">
                Welcome back, 
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block lg:inline lg:ml-3">
                  {userName}! 👋
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                Ready to continue your learning journey? Let&apos;s make today count!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard/upload">
                <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload PDF
                </Button>
              </Link>
              <Link href="/test/create">
                <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Test
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Tests */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Tests</p>
                    <p className="text-3xl font-black text-gray-900">{stats.totalTests}</p>
                    <p className="text-sm text-green-600 font-medium flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +2 this week
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Average Score */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1">
              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-black text-gray-900">{stats.averageScore}%</p>
                    <p className="text-sm text-green-600 font-medium flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +5% improvement
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Study Streak */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-1">
              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Study Streak</p>
                    <p className="text-3xl font-black text-gray-900">{stats.studyStreak} days</p>
                    <p className="text-sm text-orange-600 font-medium flex items-center mt-1">
                      <Flame className="w-4 h-4 mr-1" />
                      Keep it up!
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-2xl">
                      <Flame className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Study Time */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1">
              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Study Time</p>
                    <p className="text-3xl font-black text-gray-900">{stats.totalStudyTime}h</p>
                    <p className="text-sm text-purple-600 font-medium flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      This month
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden h-full">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1">
                <div className="bg-white rounded-3xl h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                      <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Jump into your learning activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/dashboard/upload">
                    <div className="group p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative bg-blue-500 p-3 rounded-xl">
                                <Upload className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-800">Upload PDF</h4>
                              <p className="text-sm text-gray-600">Create tests from documents</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                        </div>
                      </div>
                    </Link>

                    <Link href="/test/create">
                      <div className="group p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative bg-green-500 p-3 rounded-xl">
                                <Plus className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-800">Create Test</h4>
                              <p className="text-sm text-gray-600">Build custom assessments</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
                        </div>
                      </div>
                    </Link>

                    <Link href="/dashboard/tests">
                      <div className="group p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative bg-purple-500 p-3 rounded-xl">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-800">My Tests</h4>
                              <p className="text-sm text-gray-600">View all your tests</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                        </div>
                      </div>
                    </Link>

                    <Link href="/dashboard/analytics">
                      <div className="group p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative bg-orange-500 p-3 rounded-xl">
                                <BarChart3 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-800">Analytics</h4>
                              <p className="text-sm text-gray-600">Track your progress</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
                        </div>
                      </div>
                    </Link>                    <Link href="/dashboard/analytics">
                      <div className="group p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative bg-orange-500 p-3 rounded-xl">
                                <BarChart3 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-800">Analytics</h4>
                              <p className="text-sm text-gray-600">Track your progress</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
                        </div>
                      </div>
                    </Link>

                    {/* ADD THIS NEW TO-DO SECTION */}
                    <Link href="/dashboard/todo">
                      <div className="group p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 hover:border-teal-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-teal-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                              <div className="relative bg-teal-500 p-3 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-800">To-Do List</h4>
                              <p className="text-sm text-gray-600">Manage study tasks</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="secondary" className="mr-2 text-xs">3 pending</Badge>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>

                                         {/* ADD THIS NEW CALENDAR SECTION */}
                     <div className="group p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-200 hover:border-rose-300 transition-all duration-300 hover:shadow-lg cursor-pointer">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center">
                           <div className="relative">
                             <div className="absolute inset-0 bg-rose-500 rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                             <div className="relative bg-rose-500 p-3 rounded-xl">
                               <Calendar className="w-5 h-5 text-white" />
                             </div>
                           </div>
                           <div className="ml-3">
                             <h4 className="font-semibold text-gray-800">Quick Calendar</h4>
                             <p className="text-sm text-gray-600">Today&apos;s schedule</p>
                           </div>
                         </div>
                       </div>
                       
                       {/* Mini Calendar Widget */}
                       <div className="bg-white/70 rounded-xl p-3 border border-rose-100">
                         <div className="text-center mb-2">
                           <p className="text-sm font-semibold text-gray-800">
                             {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                           </p>
                         </div>
                         <div className="grid grid-cols-7 gap-1 text-xs">
                           {/* Fixed: Use unique keys for day headers */}
                           {[
                             { key: 'sun', label: 'S' },
                             { key: 'mon', label: 'M' },
                             { key: 'tue', label: 'T' },
                             { key: 'wed', label: 'W' },
                             { key: 'thu', label: 'T' },
                             { key: 'fri', label: 'F' },
                             { key: 'sat', label: 'S' }
                           ].map((day) => (
                             <div key={day.key} className="text-center text-gray-500 font-medium p-1">
                               {day.label}
                             </div>
                           ))}
                           {/* Fixed: Use proper unique keys for calendar dates */}
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
                                 key={`calendar-${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}-${i}`}
                                 className={`text-center p-1 rounded text-xs cursor-pointer transition-colors duration-200 ${
                                   isToday
                                     ? 'bg-rose-500 text-white font-bold'
                                     : isCurrentMonth
                                     ? 'text-gray-700 hover:bg-rose-100'
                                     : 'text-gray-300'
                                 }`}
                               >
                                 {currentDate.getDate()}
                               </div>
                             );
                           })}
                         </div>
                         <div className="mt-3 space-y-1">
                           <div className="flex items-center text-xs text-gray-600">
                             <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                             <span>Physics Test - 2:00 PM</span>
                           </div>
                           <div className="flex items-center text-xs text-gray-600">
                             <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                             <span>Study Session - 4:00 PM</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </div>
               </div>
             </Card>
           </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden h-full">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
                <div className="bg-white rounded-3xl h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                          <Activity className="w-6 h-6 mr-2 text-blue-500" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          Your latest test performances
                        </CardDescription>
                      </div>
                      <Link href="/dashboard/results">
                        <Button variant="outline" className="rounded-xl">
                          View All
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentTests.length > 0 ? (
                      <div className="space-y-4">
                        {recentTests.map((test) => (
                          <div key={test.id} className="group p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="relative">
                                  <div className={`absolute inset-0 rounded-xl blur-md opacity-20 ${
                                    test.score >= 80 ? 'bg-green-500' : test.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></div>
                                  <div className={`relative p-3 rounded-xl ${
                                    test.score >= 80 ? 'bg-green-500' : test.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
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
                                  <h4 className="font-semibold text-gray-800 text-lg">{test.title}</h4>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <p className="text-sm text-gray-600">
                                      Score: <span className="font-semibold">{test.score}%</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Questions: {test.totalQuestions}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Duration: {test.duration}m
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={test.score >= 80 ? "default" : test.score >= 60 ? "secondary" : "destructive"} className="mb-2">
                                  {test.score >= 80 ? "Excellent" : test.score >= 60 ? "Good" : "Needs Work"}
                                </Badge>
                                <p className="text-sm text-gray-500">
                                  {new Date(test.completedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Performance</span>
                                <span>{test.score}%</span>
                              </div>
                              <Progress 
                                value={test.score} 
                                className="h-2 bg-gray-200"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-gray-300 rounded-full blur-lg opacity-20"></div>
                          <div className="relative bg-gray-300 p-6 rounded-full">
                            <BookOpen className="w-12 h-12 text-gray-500" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No tests taken yet</h3>
                        <p className="text-gray-600 mb-6">Start your learning journey by taking your first test!</p>
                        <Link href="/test/create">
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Test
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Chart */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-1">
              <div className="bg-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                    <LineChart className="w-6 h-6 mr-2 text-emerald-500" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Your progress over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-200">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Performance Chart</p>
                      <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Upcoming Tests */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-1">
              <div className="bg-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-violet-500" />
                    Upcoming Tests
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Tests scheduled for this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingTests.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingTests.map((test) => (
                        <div key={test.id} className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{test.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {test.questionCount} questions • {test.difficulty} difficulty
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-violet-600">
                                {new Date(test.scheduledFor).toLocaleDateString()}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                Scheduled
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming tests scheduled</p>
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Custom Animations */}
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
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
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
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        /* Gradient text animation */
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        /* Pulse glow effect */
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* Floating animation */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        /* Bounce in animation */
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.6s ease-out;
        }
        
        /* Slide up animation */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }
        
        /* Hover glow effect */
        .hover-glow:hover {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        
        /* Custom scrollbar */
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