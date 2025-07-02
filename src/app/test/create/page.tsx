'use client' // This directive must be at the very top

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase' // Ensure this path is correct: src/lib/supabase.ts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, PlusCircle, CheckCircle, XCircle } from 'lucide-react'

// Define interfaces for data fetched from Supabase
interface Subject {
  id: number;
  name: string;
}

export default function CreateTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [user, setUser] = useState<{ id: string } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalQuestions, setTotalQuestions] = useState<number>(50) // Default to 50
  const [durationMinutes, setDurationMinutes] = useState<number>(180) // Default to 180 minutes (3 hours)
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
  const [testType, setTestType] = useState<'practice' | 'mock' | 'custom'>('practice')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]) // Store array of subject names

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !supabaseUser) {
          console.error("Authentication error or no user:", authError);
          router.push('/auth/login'); // Redirect to login if not authenticated
          return;
        }
        setUser({ id: supabaseUser.id });

        // Fetch subjects from Supabase
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name', { ascending: true });

        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError);
          setError('Failed to load subjects. Please try again.');
        } else {
          setSubjects(subjectsData || []);
        }
      } catch (e: unknown) { // Changed 'any' to 'unknown'
        console.error("Unexpected error during initial data load:", e);
        setError(`An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`); // Type narrowing for error message
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [router]); // Dependency array includes router to avoid lint warnings

  const handleSubjectToggle = (subjectName: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectName)
        ? prev.filter(name => name !== subjectName)
        : [...prev, subjectName]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!user) {
      setError('User not authenticated. Please log in.')
      setSubmitting(false)
      return
    }

    if (!title.trim() || totalQuestions <= 0 || durationMinutes <= 0 || selectedSubjects.length === 0) {
      setError('Please fill in all required fields (Title, Total Questions, Duration, Subjects).')
      setSubmitting(false)
      return
    }

    try {
      const { data: insertedTestData, error: insertError } = await supabase // Renamed 'data' to 'insertedTestData' and will use it
        .from('tests')
        .insert([
          {
            user_id: user.id,
            title: title.trim(), // Trim whitespace
            description: description.trim() || null, // Trim and set to null if empty
            total_questions: totalQuestions,
            duration_minutes: durationMinutes,
            difficulty_level: difficultyLevel,
            test_type: testType,
            subjects: selectedSubjects, // Store array of subject names
            is_active: true,
          },
        ])
        .select() // Select the inserted data to confirm

      if (insertError) {
        throw insertError
      }

      // Log the inserted data to make the 'insertedTestData' variable used
      console.log('Successfully created test:', insertedTestData);

      setSuccess('Test created successfully! You can now view it in your dashboard.')
      // Optionally, clear form or redirect
      setTitle('')
      setDescription('')
      setTotalQuestions(50)
      setDurationMinutes(180)
      setDifficultyLevel('mixed')
      setTestType('practice')
      setSelectedSubjects([])
      // router.push('/dashboard/tests'); // Redirect to tests listing page after a short delay
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Error creating test:', err)
      setError(`Failed to create test: ${err instanceof Error ? err.message : String(err)}`) // Type narrowing for error message
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          Loading test creation form...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated background elements (ensure these animations are defined in tailwind.config.js) */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Create New Test
            </h1>
            <p className="text-lg text-gray-300">
              Define the blueprint for your next practice session.
            </p>
          </div>
          <Link href="/dashboard/tests"> {/* Link back to the dashboard tests listing */}
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl px-5 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tests
            </Button>
          </Link>
        </div>

        {/* Create Test Card */}
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl p-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-3xl font-bold">Test Details</CardTitle>
            <p className="text-gray-300 text-md">Fill in the information for your new test.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Test Title */}
              <div>
                <Label htmlFor="title" className="text-white text-lg mb-2 block">Test Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., JEE Main Mock Test 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-white text-lg mb-2 block">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of the test content or focus."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Questions */}
                <div>
                  <Label htmlFor="totalQuestions" className="text-white text-lg mb-2 block">Total Questions</Label>
                  <Input
                    id="totalQuestions"
                    type="number"
                    placeholder="e.g., 50"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                    min="1"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="durationMinutes" className="text-white text-lg mb-2 block">Duration (Minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    placeholder="e.g., 180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    min="1"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Difficulty Level */}
                <div>
                  <Label htmlFor="difficultyLevel" className="text-white text-lg mb-2 block">Difficulty Level</Label>
                  <Select value={difficultyLevel} onValueChange={(value: 'easy' | 'medium' | 'hard' | 'mixed') => setDifficultyLevel(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg p-3">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Type */}
                <div>
                  <Label htmlFor="testType" className="text-white text-lg mb-2 block">Test Type</Label>
                  <Select value={testType} onValueChange={(value: 'practice' | 'mock' | 'custom') => setTestType(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg p-3">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="mock">Mock Test</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subjects Multi-Select */}
              <div>
                <Label className="text-white text-lg mb-2 block">Subjects</Label>
                <div className="flex flex-wrap gap-3">
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <Button
                        key={subject.id}
                        type="button"
                        variant={selectedSubjects.includes(subject.name) ? 'default' : 'outline'}
                        onClick={() => handleSubjectToggle(subject.name)}
                        className={`
                          rounded-full px-5 py-2 text-md transition-all duration-200
                          ${selectedSubjects.includes(subject.name)
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md hover:from-blue-600 hover:to-purple-600'
                            : 'border-white/30 text-gray-300 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        {subject.name}
                      </Button>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No subjects available. Please add subjects to your database.</p>
                  )}
                </div>
              </div>

              {/* Submission Status Messages */}
              {error && (
                <div className="flex items-center p-4 rounded-xl shadow-md bg-red-500/20 text-red-300 border border-red-400 animate-fade-in">
                  <XCircle className="w-6 h-6 mr-3" />
                  <p className="text-lg font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center p-4 rounded-xl shadow-md bg-green-500/20 text-green-300 border border-green-400 animate-fade-in">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <p className="text-lg font-medium">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !user}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-4 px-6 rounded-xl text-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Creating Test...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-6 h-6 mr-3" />
                    Create Test
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
