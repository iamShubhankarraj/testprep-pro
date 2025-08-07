'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  Clock, 
  Star, 
  Target,
  Zap,
  Brain,
  Trophy,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Edit3,
  Save,
  X,
  Sparkles,
  Flame,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  category: string
  created_at: string
  updated_at: string
  user_id: string
}

interface TodoStats {
  total: number
  completed: number
  pending: number
  overdue: number
  todaysDue: number
  weeklyCompleted: number
}

export default function TodoPage() {
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    todaysDue: 0,
    weeklyCompleted: 0
  })
  const [loading, setLoading] = useState(true)
  const [newTodo, setNewTodo] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newCategory, setNewCategory] = useState('General')
  const [newDueDate, setNewDueDate] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      setRefreshing(true)

      const { data: todosData, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching todos:', error)
        return
      }

      const todosList = todosData || []
      setTodos(todosList)

      // Calculate stats
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const completed = todosList.filter(t => t.completed).length
      const pending = todosList.filter(t => !t.completed).length
      const overdue = todosList.filter(t => 
        !t.completed && t.due_date && new Date(t.due_date) < now
      ).length
      const todaysDue = todosList.filter(t => 
        !t.completed && t.due_date && t.due_date.split('T')[0] === today
      ).length
      const weeklyCompleted = todosList.filter(t => 
        t.completed && new Date(t.updated_at) > weekAgo
      ).length

      setStats({
        total: todosList.length,
        completed,
        pending,
        overdue,
        todaysDue,
        weeklyCompleted
      })

    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const todoData = {
        title: newTodo.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        category: newCategory,
        due_date: newDueDate || null,
        user_id: user.id,
        completed: false
      }

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single()

      if (error) {
        console.error('Error adding todo:', error)
        return
      }

      setTodos([data, ...todos])
      setNewTodo('')
      setNewDescription('')
      setNewDueDate('')
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1
      }))

    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id)
      if (!todo) return

      const { error } = await supabase
        .from('todos')
        .update({ 
          completed: !todo.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating todo:', error)
        return
      }

      setTodos(todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed, updated_at: new Date().toISOString() } : t
      ))

      // Update stats
      if (todo.completed) {
        setStats(prev => ({
          ...prev,
          completed: prev.completed - 1,
          pending: prev.pending + 1
        }))
      } else {
        setStats(prev => ({
          ...prev,
          completed: prev.completed + 1,
          pending: prev.pending - 1,
          weeklyCompleted: prev.weeklyCompleted + 1
        }))
      }

    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting todo:', error)
        return
      }

      const todo = todos.find(t => t.id === id)
      setTodos(todos.filter(t => t.id !== id))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        completed: todo?.completed ? prev.completed - 1 : prev.completed,
        pending: todo?.completed ? prev.pending : prev.pending - 1
      }))

    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const updateTodo = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ 
          title: newTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating todo:', error)
        return
      }

      setTodos(todos.map(t => 
        t.id === id ? { ...t, title: newTitle.trim(), updated_at: new Date().toISOString() } : t
      ))
      setEditingId(null)
      setEditText('')

    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-pink-600'
      case 'medium': return 'from-yellow-500 to-orange-600'
      case 'low': return 'from-green-500 to-emerald-600'
      default: return 'from-gray-500 to-slate-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flame className="w-4 h-4" />
      case 'medium': return <Zap className="w-4 h-4" />
      case 'low': return <Target className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const filteredTodos = todos.filter(todo => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'completed' && todo.completed) ||
      (filter === 'pending' && !todo.completed) ||
      (filter === 'overdue' && !todo.completed && todo.due_date && isOverdue(todo.due_date))

    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.category.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Tasks</h2>
          <p className="text-gray-300">Organizing your study schedule...</p>
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
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black text-white">
                    Study Tasks
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ml-3">
                      Manager
                    </span>
                  </h1>
                  <p className="text-xl text-gray-300">Stay organized and track your learning progress</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={fetchTodos}
              disabled={refreshing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {/* Total Tasks */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl backdrop-blur-sm border border-blue-500/30">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{stats.total}</div>
                  <div className="text-sm text-blue-400 font-medium">Total Tasks</div>
                  <Progress value={(stats.total / 50) * 100} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl backdrop-blur-sm border border-green-500/30">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{stats.completed}</div>
                  <div className="text-sm text-green-400 font-medium">Completed</div>
                  <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Pending */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{stats.pending}</div>
                  <div className="text-sm text-yellow-400 font-medium">Pending</div>
                  <Progress value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Overdue */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-2xl backdrop-blur-sm border border-red-500/30">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{stats.overdue}</div>
                  <div className="text-sm text-red-400 font-medium">Overdue</div>
                  <Progress value={stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>

          {/* Weekly Completed */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transform hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl backdrop-blur-sm border border-purple-500/30">
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">{stats.weeklyCompleted}</div>
                  <div className="text-sm text-purple-400 font-medium">This Week</div>
                  <Progress value={(stats.weeklyCompleted / 7) * 100} className="h-2 bg-white/10" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="pl-12 bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-2xl h-12 backdrop-blur-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'completed', 'overdue'] as const).map((filterType) => (
              <Button
                key={filterType}
                onClick={() => setFilter(filterType)}
                variant={filter === filterType ? "default" : "outline"}
                className={`rounded-xl transition-all duration-300 ${
                  filter === filterType
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Task */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-violet-400" />
                  Add New Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Input
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Enter your study task..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  />
                  
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Add description (optional)..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 backdrop-blur-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-violet-500 transition-colors duration-200"
                    >
                      <option value="low" className="bg-gray-800">Low Priority</option>
                      <option value="medium" className="bg-gray-800">Medium Priority</option>
                      <option value="high" className="bg-gray-800">High Priority</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-violet-500 transition-colors duration-200"
                    >
                      <option value="General" className="bg-gray-800">General</option>
                      <option value="Mathematics" className="bg-gray-800">Mathematics</option>
                      <option value="Physics" className="bg-gray-800">Physics</option>
                      <option value="Chemistry" className="bg-gray-800">Chemistry</option>
                      <option value="Biology" className="bg-gray-800">Biology</option>
                      <option value="English" className="bg-gray-800">English</option>
                      <option value="Computer Science" className="bg-gray-800">Computer Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Due Date</label>
                    <Input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="bg-white/10 border-white/20 text-white rounded-xl h-12 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <Button 
                  onClick={addTodo} 
                  disabled={!newTodo.trim()}
                  className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Task
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-white flex items-center">
                    <BookOpen className="w-6 h-6 mr-2 text-blue-400" />
                    Your Study Tasks
                  </CardTitle>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {filteredTodos.length} tasks
                  </Badge>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {filteredTodos.length > 0 ? (
                  filteredTodos.map((todo, index) => (
                    <div 
                      key={todo.id} 
                      className={`group p-6 rounded-2xl border transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1 ${
                        todo.completed 
                          ? 'bg-white/5 border-white/10 opacity-75' 
                          : 'bg-gradient-to-r from-white/10 to-white/5 border-white/20 hover:border-white/30'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start space-x-4">
                        <button 
                          onClick={() => toggleTodo(todo.id)}
                          className="flex-shrink-0 mt-1 transform hover:scale-110 transition-transform duration-200"
                        >
                          {todo.completed ? (
                            <div className="relative">
                              <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                              <CheckCircle className="relative w-6 h-6 text-green-400 hover:text-green-300 transition-colors duration-200" />
                            </div>
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 hover:text-blue-400 transition-colors duration-200" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            {editingId === todo.id ? (
                              <div className="flex-1 flex items-center space-x-2">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white rounded-xl"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateTodo(todo.id, editText)
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateTodo(todo.id, editText)}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditText('')
                                  }}
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <h4 className={`text-lg font-semibold transition-all duration-200 ${
                                    todo.completed 
                                      ? 'text-gray-400 line-through' 
                                      : 'text-white'
                                  }`}>
                                    {todo.title}
                                  </h4>
                                  {todo.description && (
                                    <p className={`text-sm mt-1 ${
                                      todo.completed ? 'text-gray-500' : 'text-gray-300'
                                    }`}>
                                      {todo.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button 
                                    onClick={() => {
                                      setEditingId(todo.id)
                                      setEditText(todo.title)
                                    }}
                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 p-1 rounded-lg hover:bg-blue-500/20"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteTodo(todo.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 rounded-lg hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center flex-wrap gap-3 text-sm">
                            <Badge 
                              className={`bg-gradient-to-r ${getPriorityColor(todo.priority)} text-white border-0 flex items-center space-x-1`}
                            >
                              {getPriorityIcon(todo.priority)}
                              <span>{todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}</span>
                            </Badge>
                            
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {todo.category}
                            </Badge>
                            
                            {todo.due_date && (
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                                !todo.completed && isOverdue(todo.due_date)
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-white/10 text-gray-300'
                              }`}>
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(todo.due_date).toLocaleDateString()}</span>
                                {!todo.completed && isOverdue(todo.due_date) && (
                                  <AlertCircle className="w-4 h-4 ml-1" />
                                )}
                              </div>
                            )}

                            <div className="flex items-center space-x-1 text-gray-400 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>Created {new Date(todo.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Progress indicator for completed tasks */}
                          {todo.completed && (
                            <div className="mt-3 flex items-center space-x-2">
                              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-shimmer"></div>
                              </div>
                              <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-8 rounded-full border border-blue-500/30">
                        <CheckCircle className="w-16 h-16 text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
                    </h3>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                      {filter === 'all' 
                        ? 'Add your first study task to get started on your learning journey!'
                        : `You don't have any ${filter} tasks at the moment.`
                      }
                    </p>
                    {filter === 'all' && (
                      <Button 
                        onClick={() => document.querySelector('input')?.focus()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Task
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Productivity Insights */}
        {todos.length > 0 && (
          <div className="mt-12">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-violet-400" />
                  Productivity Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Completion Rate */}
                  <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Completion Rate</h4>
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </div>
                    <Progress 
                      value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                      className="h-2 bg-white/10" 
                    />
                    <p className="text-sm text-gray-300 mt-2">
                      {stats.completed} of {stats.total} tasks completed
                    </p>
                  </div>

                  {/* Weekly Progress */}
                  <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Weekly Progress</h4>
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {stats.weeklyCompleted}
                    </div>
                    <Progress 
                      value={(stats.weeklyCompleted / 7) * 100} 
                      className="h-2 bg-white/10" 
                    />
                    <p className="text-sm text-gray-300 mt-2">
                      Tasks completed this week
                    </p>
                  </div>

                  {/* Priority Distribution */}
                  <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Priority Focus</h4>
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map((priority) => {
                        const count = todos.filter(t => t.priority === priority && !t.completed).length
                        const total = todos.filter(t => !t.completed).length
                        const percentage = total > 0 ? (count / total) * 100 : 0
                        
                        return (
                          <div key={priority} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300 capitalize">{priority}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${getPriorityColor(priority)} rounded-full transition-all duration-1000`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-white font-medium w-8">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
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
        
        /* Loading states */
        .skeleton {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.1) 25%, 
            rgba(255, 255, 255, 0.2) 50%, 
            rgba(255, 255, 255, 0.1) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        /* Micro-interactions */
        .micro-bounce:hover {
          animation: micro-bounce 0.3s ease-in-out;
        }
        
        @keyframes micro-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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
        
        /* Data visualization enhancements */
        .data-point {
          transition: all 0.3s ease;
        }
        
        .data-point:hover {
          transform: scale(1.2);
          filter: drop-shadow(0 0 10px currentColor);
        }
        
        /* Staggered animations */
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        
        /* Gradient animations */
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        /* Pulse variations */
        .pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .pulse-fast {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Scale animations */
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        
        /* Slide animations */
        @keyframes slide-in-left {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-in-right {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
        }
        
        /* Rotation animations */
        @keyframes rotate-in {
          0% { transform: rotate(-180deg) scale(0); opacity: 0; }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        
        .animate-rotate-in {
          animation: rotate-in 0.8s ease-out forwards;
        }
        
        /* Elastic animations */
        @keyframes elastic {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .animate-elastic {
          animation: elastic 0.6s ease-out;
        }
        
        /* Typewriter effect */
        @keyframes typewriter {
          0% { width: 0; }
          100% { width: 100%; }
        }
        
        .typewriter {
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 2s steps(40) forwards;
        }
        
        /* Glow effects */
        .glow-blue {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        
        .glow-purple {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }
        
        .glow-green {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }
        
        .glow-orange {
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
        }
        
        /* Breathing animation */
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        
        /* Wobble effect */
        @keyframes wobble {
          0% { transform: translateX(0%); }
          15% { transform: translateX(-25%) rotate(-5deg); }
          30% { transform: translateX(20%) rotate(3deg); }
          45% { transform: translateX(-15%) rotate(-3deg); }
          60% { transform: translateX(10%) rotate(2deg); }
          75% { transform: translateX(-5%) rotate(-1deg); }
          100% { transform: translateX(0%); }
        }
        
        .animate-wobble {
          animation: wobble 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}