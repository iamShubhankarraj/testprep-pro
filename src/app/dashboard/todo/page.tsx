// src/app/dashboard/todo/page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Circle, Plus, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function TodoPage() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Complete Math Chapter 5", completed: false },
    { id: 2, text: "Review Chemistry Notes", completed: true },
    { id: 3, text: "Practice Physics Problems", completed: false },
  ])
  const [newTodo, setNewTodo] = useState('')

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }])
      setNewTodo('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">To-Do List</h1>
            <p className="text-gray-300">Manage your study tasks</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Add Todo */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Enter a new task..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              <Button onClick={addTodo} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Your Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todos.map((todo) => (
              <div key={todo.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                <button onClick={() => toggleTodo(todo.id)}>
                  {todo.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/60" />
                  )}
                </button>
                <span className={`flex-1 ${todo.completed ? 'text-white/60 line-through' : 'text-white'}`}>
                  {todo.text}
                </span>
                <button onClick={() => deleteTodo(todo.id)}>
                  <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
