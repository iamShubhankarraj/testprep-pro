'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  Clock,
  Target,
  BookOpen,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface TestForm {
  title: string
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  duration: number
  description: string
  questions: Question[]
}

export default function CreateTest() {
  const [form, setForm] = useState<TestForm>({
    title: '',
    subject: '',
    difficulty: 'Medium',
    duration: 60,
    description: '',
    questions: []
  })
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  const difficulties = ['Easy', 'Medium', 'Hard']

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setMessage({ type: 'error', text: 'Please enter a question' })
      return
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      setMessage({ type: 'error', text: 'Please fill all options' })
      return
    }

    const newQuestion: Question = {
      ...currentQuestion,
      id: Date.now().toString()
    }

    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))

    setCurrentQuestion({
      id: '',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    })

    setMessage({ type: 'success', text: 'Question added successfully!' })
  }

  const removeQuestion = (id: string) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const handleSaveTest = async () => {
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: 'Please enter a test title' })
      return
    }

    if (!form.subject) {
      setMessage({ type: 'error', text: 'Please select a subject' })
      return
    }

    if (form.questions.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one question' })
      return
    }

    // Here you would typically save to your database
    console.log('Saving test:', form)
    
    setMessage({ type: 'success', text: 'Test created successfully! Redirecting...' })
    
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Test</h1>
                <p className="text-sm text-gray-300">Build your custom test</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Test Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Set up the basic details for your test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Test Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., JEE Main Physics - Mechanics"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="subject" className="text-white">Subject</Label>
                    <select
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={form.difficulty}
                      onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this test covers..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Question */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Add Question</CardTitle>
                <CardDescription className="text-gray-300">
                  Create a new question for your test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="question" className="text-white">Question</Label>
                  <textarea
                    id="question"
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter your question here..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-white">Options</Label>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index}
                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                          className="text-blue-600"
                        />
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options]
                            newOptions[index] = e.target.value
                            setCurrentQuestion(prev => ({ ...prev, options: newOptions }))
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="explanation" className="text-white">Explanation (Optional)</Label>
                  <textarea
                    id="explanation"
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain why this is the correct answer..."
                    rows={2}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 resize-none"
                  />
                </div>

                <Button onClick={addQuestion} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            {/* Questions List */}
            {form.questions.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Questions ({form.questions.length})</CardTitle>
                  <CardDescription className="text-gray-300">
                    Review and manage your questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.questions.map((question, index) => (
                      <div key={question.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary" className="bg-white/10 text-gray-300">
                                Q{index + 1}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                Option {question.correctAnswer + 1}
                              </Badge>
                            </div>
                            <p className="text-white mb-2">{question.text}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className={`p-2 rounded ${optIndex === question.correctAnswer ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-gray-300'}`}>
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <p className="text-gray-400 text-sm mt-2 italic">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Test Preview */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Test Preview</CardTitle>
                <CardDescription className="text-gray-300">
                  Quick overview of your test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Title:</span>
                    <span className="text-white font-medium">{form.title || 'Untitled Test'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Subject:</span>
                    <Badge variant="secondary" className="bg-white/10 text-gray-300">
                      {form.subject || 'Not selected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Difficulty:</span>
                    <Badge className={form.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : form.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {form.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white">{form.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Questions:</span>
                    <span className="text-white">{form.questions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSaveTest}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Test
                </Button>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Test
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 mt-0.5 text-blue-400" />
                  <p>Keep questions clear and concise</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 mt-0.5 text-green-400" />
                  <p>Set realistic time limits</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Brain className="w-4 h-4 mt-0.5 text-purple-400" />
                  <p>Mix easy, medium, and hard questions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message */}
        {message && (
          <Alert className={`mt-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={`${message.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
