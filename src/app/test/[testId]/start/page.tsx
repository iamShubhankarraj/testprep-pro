'use client'
import 'katex/dist/katex.min.css';
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Flag,
  Send,
  AlertCircle,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
  BookOpen,
  Target,
  Zap,
  Brain,
  Timer,
  FileText,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import 'katex/dist/katex.min.css';
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.js';

// --- Interfaces ---
interface TestDefinition {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'mixed';
  test_type: 'practice' | 'mock' | 'custom';
  subjects: string[] | null;
  created_at: string;
  is_active: boolean;
}

interface Question {
  id: string;
  pdf_id: string | null;
  user_id: string;
  subject_id: number | null;
  topic_id: number | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  difficulty_level: 'easy' | 'medium' | 'hard';
  question_type: 'mcq' | 'numerical';
  created_at: string;
}

interface TestQuestionWithDetails {
  id: string;
  question_order: number;
  questions: Question;
}

type QuestionStatus = 'unattempted' | 'answered' | 'marked' | 'answered_marked';

// --- KaTeX Renderer Component ---
const KatexRenderer: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = text;
      renderMathInElement(ref.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\KATEX_INLINE_OPEN', right: '\KATEX_INLINE_CLOSE', display: false }
        ],
        throwOnError: false
      });
    }
  }, [text]);

  return <div ref={ref} />;
};

export default function TestTakingPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string
  const [user, setUser] = useState<{ id: string } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showQuestionPalette, setShowQuestionPalette] = useState(true)

  const [test, setTest] = useState<TestDefinition | null>(null)
  const [questions, setQuestions] = useState<TestQuestionWithDetails[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map())
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [testAttemptId, setTestAttemptId] = useState<string | null>(null)

  // Get question status
  const getQuestionStatus = (questionId: string): QuestionStatus => {
    const isAnswered = userAnswers.has(questionId)
    const isMarked = markedQuestions.has(questionId)
    
    if (isAnswered && isMarked) return 'answered_marked'
    if (isAnswered) return 'answered'
    if (isMarked) return 'marked'
    return 'unattempted'
  }

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      answered: 0,
      unattempted: 0,
      marked: 0,
      answered_marked: 0
    }
    
    questions.forEach(q => {
      const status = getQuestionStatus(q.questions.id)
      counts[status]++
    })
    
    return counts
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Initialize test
  useEffect(() => {
    const initializeTest = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !supabaseUser) {
          console.error("Authentication error:", authError);
          router.push('/auth/login');
          return;
        }
        setUser({ id: supabaseUser.id });

        // Fetch Test Definition
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError || !testData) {
          throw new Error(testError?.message || 'Test not found.');
        }
        setTest(testData);
        setTimeLeft(testData.duration_minutes * 60);

        // Fetch Questions
        const { data: testQuestionsData, error: questionsError } = await supabase
          .from('test_questions')
          .select(`
            id,
            question_order,
            questions (*)
          `)
          .eq('test_id', testId)
          .order('question_order', { ascending: true });

        if (questionsError || !testQuestionsData) {
          throw new Error(questionsError?.message || 'No questions found for this test.');
        }

        const validQuestions = testQuestionsData.filter(tq => tq.questions !== null) as unknown as TestQuestionWithDetails[];
        setQuestions(validQuestions);

        // Create Test Attempt
        const { data: attemptData, error: attemptError } = await supabase
          .from('test_attempts')
          .insert([
            {
              user_id: supabaseUser.id,
              test_id: testId,
              started_at: new Date().toISOString(),
              total_questions: testData.total_questions,
              max_possible_score: testData.total_questions * 4,
              status: 'in_progress',
            },
          ])
          .select('id')
          .single();

        if (attemptError || !attemptData) {
          throw new Error(attemptError?.message || 'Failed to start test attempt.');
        }
        setTestAttemptId(attemptData.id);

      } catch (err: unknown) {
        console.error('Error initializing test:', err);
        setError(`Failed to load test: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    initializeTest();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testId, router]);

  // Timer Logic
  useEffect(() => {
    if (!loading && timeLeft > 0 && testAttemptId && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            handleSubmitTest();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading, timeLeft, testAttemptId, isPaused]);

  // Event handlers
  const handleAnswerSelect = (questionId: string, option: string) => {
    setUserAnswers(prev => new Map(prev).set(questionId, option));
  }

  const handleMarkForReview = () => {
    const currentQuestionId = questions[currentQuestionIndex]?.questions.id
    if (currentQuestionId) {
      setMarkedQuestions(prev => {
        const newSet = new Set(prev)
        if (newSet.has(currentQuestionId)) {
          newSet.delete(currentQuestionId)
        } else {
          newSet.add(currentQuestionId)
        }
        return newSet
      })
    }
  }

  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }

  const handleSubmitTest = async () => {
    if (!testAttemptId || !user || !test) {
      setError('Test attempt not initialized or user not logged in.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // Step 1: Save all user responses to test_responses table
      const responses = Array.from(userAnswers.entries()).map(([questionId, userAnswer]) => {
        const question = questions.find(q => q.questions.id === questionId)?.questions;
        const isCorrect = question ? question.correct_answer === userAnswer : false;
        
        return {
          attempt_id: testAttemptId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_taken_seconds: 30, // You can track this per question if needed
          marked_for_review: markedQuestions.has(questionId)
        };
      });
  
      // Also add responses for unanswered questions
      questions.forEach(q => {
        if (!userAnswers.has(q.questions.id)) {
          responses.push({
            attempt_id: testAttemptId,
            question_id: q.questions.id,
            user_answer: '',
            is_correct: false,
            time_taken_seconds: 0,
            marked_for_review: markedQuestions.has(q.questions.id)
          });
        }
      });
  
      // Insert all responses
      const { error: responsesError } = await supabase
        .from('test_responses')
        .insert(responses);
  
      if (responsesError) {
        console.error('Error saving responses:', responsesError);
        throw responsesError;
      }
  
      // Step 2: Calculate scores
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const incorrectAnswers = responses.filter(r => r.user_answer && !r.is_correct).length;
      const totalAttempted = responses.filter(r => r.user_answer).length;
      const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
  
      // Step 3: Update test attempt with final results
      const { error: updateError } = await supabase
        .from('test_attempts')
        .update({
          completed_at: new Date().toISOString(),
          time_taken_minutes: test.duration_minutes - Math.floor(timeLeft / 60),
          status: 'completed',
          score: score,
          correct_answers: correctAnswers,
          incorrect_answers: incorrectAnswers,
          total_questions: questions.length,
          raw_score: correctAnswers * 4 - incorrectAnswers * 1 // JEE/NEET scoring: +4 correct, -1 incorrect
        })
        .eq('id', testAttemptId)
        .eq('user_id', user.id);
  
      if (updateError) {
        throw updateError;
      }
  
      console.log('Test submitted successfully with responses saved');
      console.log(`Score: ${score}%, Correct: ${correctAnswers}, Incorrect: ${incorrectAnswers}`);
  
      // Redirect to results page
      router.push(`/dashboard/results?testId=${testId}&attemptId=${testAttemptId}`);
      
    } catch (err: unknown) {
      console.error('Error submitting test:', err);
      setError(`Failed to submit test: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-xl font-medium">Initializing test environment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden max-w-md">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-1">
            <div className="bg-white rounded-3xl p-8 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Test</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/dashboard/tests">
                <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl">
                  Back to Tests
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden max-w-md">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-1">
            <div className="bg-white rounded-3xl p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Not Available</h2>
              <p className="text-gray-600 mb-6">The test you are trying to access does not exist or has no questions.</p>
              <Link href="/dashboard/tests">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl">
                  Browse Tests
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]?.questions;
  const statusCounts = getStatusCounts();

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden max-w-md">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-1">
            <div className="bg-white rounded-3xl p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Question Not Found</h2>
              <p className="text-gray-600 mb-6">The current question could not be loaded.</p>
              <Link href="/dashboard/tests">
                <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl">
                  Back to Tests
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-red-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Left Sidebar - Question Palette */}
        <div className={`transition-all duration-300 ${showQuestionPalette ? 'w-80' : 'w-16'} bg-white/80 backdrop-blur-xl border-r border-gray-200 shadow-xl`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {showQuestionPalette && (
                <h3 className="text-lg font-bold text-gray-800">Question Palette</h3>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuestionPalette(!showQuestionPalette)}
                className="hover:bg-gray-100"
              >
                {showQuestionPalette ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {showQuestionPalette && (
            <>
              {/* Status Legend */}
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-green-500 rounded-lg mr-2"></div>
                    <span className="text-gray-700">Answered ({statusCounts.answered + statusCounts.answered_marked})</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg mr-2"></div>
                    <span className="text-gray-700">Marked ({statusCounts.marked + statusCounts.answered_marked})</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-gray-300 rounded-lg mr-2"></div>
                    <span className="text-gray-700">Not Visited ({statusCounts.unattempted})</span>
                  </div>
                </div>
              </div>

              {/* Question Grid */}
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const status = getQuestionStatus(q.questions.id)
                    const isCurrentQuestion = index === currentQuestionIndex
                    
                    let bgColor = 'bg-gray-300 hover:bg-gray-400'
                    let textColor = 'text-gray-700'
                    let borderColor = 'border-transparent'
                    
                    if (status === 'answered' || status === 'answered_marked') {
                      bgColor = 'bg-green-500 hover:bg-green-600'
                      textColor = 'text-white'
                    } else if (status === 'marked') {
                      bgColor = 'bg-blue-500 hover:bg-blue-600'
                      textColor = 'text-white'
                    }
                    
                    if (isCurrentQuestion) {
                      borderColor = 'border-orange-500 border-2'
                    }
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleQuestionJump(index)}
                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${bgColor} ${textColor} ${borderColor} shadow-sm hover:shadow-md`}
                      >
                        {index + 1}
                        {status === 'marked' || status === 'answered_marked' ? (
                          <Flag className="w-3 h-3 absolute -top-1 -right-1" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{statusCounts.answered + statusCounts.answered_marked}</div>
                    <div className="text-xs text-gray-600">Answered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">{statusCounts.unattempted}</div>
                    <div className="text-xs text-gray-600">Remaining</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Test Info */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20"></div>
                    <div className="relative bg-blue-500 p-3 rounded-xl">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">{test.title}</h1>
                    <p className="text-sm text-gray-600">
                      Question {currentQuestionIndex + 1} of {questions.length} • {test.test_type.charAt(0).toUpperCase() + test.test_type.slice(1)} Test
                    </p>
                  </div>
                </div>

                {/* Timer and Controls */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPaused(!isPaused)}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 ${
                    timeLeft < 300 ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'
                  }`}>
                    <Timer className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
                    <span className={`text-xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <Link href="/dashboard">
                    <Button variant="outline" size="icon" className="border-gray-300 hover:bg-gray-50">
                      <Home className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Test Progress</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
                </div>
                <Progress
                  value={((currentQuestionIndex + 1) / questions.length) * 100}
                  className="h-2 bg-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto p-6">
              {/* Question Card */}
              <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
                  <div className="bg-white rounded-3xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Question {currentQuestionIndex + 1}
                          </Badge>
                          <Badge variant="outline" className={`${
                            currentQuestion.difficulty_level === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                            currentQuestion.difficulty_level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {currentQuestion.difficulty_level.charAt(0).toUpperCase() + currentQuestion.difficulty_level.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkForReview}
                            className={`${
                              markedQuestions.has(currentQuestion.id)
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'border-gray-300 text-gray-700'
                            }`}
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            {markedQuestions.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
                          </Button>
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl text-gray-800 leading-relaxed">
                        <KatexRenderer text={currentQuestion.question_text} />
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <RadioGroup
                        onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                        value={userAnswers.get(currentQuestion.id) || ''}
                        className="space-y-4"
                      >
                        {['A', 'B', 'C', 'D'].map((optionKey) => {
                          const optionText = currentQuestion[`option_${optionKey.toLowerCase()}` as keyof Question];
                          const isSelected = userAnswers.get(currentQuestion.id) === optionKey;
                          
                          return (
                            <div 
                              key={optionKey} 
                              className={`group p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                                isSelected 
                                  ? 'border-blue-400 bg-blue-50 shadow-lg' 
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                <RadioGroupItem 
                                  value={optionKey} 
                                  id={`option-${optionKey}`} 
                                  className="mt-1 text-blue-500 border-blue-400 focus:ring-blue-500" 
                                />
                                <Label 
                                  htmlFor={`option-${optionKey}`} 
                                  className="flex-1 cursor-pointer text-gray-800 leading-relaxed"
                                >
                                  <div className="flex items-start">
                                    <span className="font-bold text-lg mr-3 text-blue-600">{optionKey}.</span>
                                    <div className="flex-1">
                                      <KatexRenderer text={String(optionText || '')} />
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-lg">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Previous Button */}
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {/* Center Actions */}
                                {/* Center Actions */}
                <div className="flex items-center space-x-4">
                  {/* Question Navigator */}
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuestionJump(Math.max(0, currentQuestionIndex - 5))}
                      disabled={currentQuestionIndex === 0}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 px-3">
                      {currentQuestionIndex + 1} / {questions.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuestionJump(Math.min(questions.length - 1, currentQuestionIndex + 5))}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Clear Response */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newAnswers = new Map(userAnswers)
                      newAnswers.delete(currentQuestion.id)
                      setUserAnswers(newAnswers)
                    }}
                    disabled={!userAnswers.has(currentQuestion.id)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear
                  </Button>

                  {/* Save & Mark for Review */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleMarkForReview()
                      if (currentQuestionIndex < questions.length - 1) {
                        handleNextQuestion()
                      }
                    }}
                    className={`${
                      markedQuestions.has(currentQuestion.id)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                    }`}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Save & Mark
                  </Button>
                </div>

                {/* Next/Submit Button */}
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitTest}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Submit {test.title}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    Save & Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              {/* Quick Stats Bar */}
              <div className="mt-4 flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    Answered: <span className="font-semibold">{statusCounts.answered + statusCounts.answered_marked}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    Marked: <span className="font-semibold">{statusCounts.marked + statusCounts.answered_marked}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">
                    Not Visited: <span className="font-semibold">{statusCounts.unattempted}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">
                    Progress: <span className="font-semibold text-purple-600">
                      {Math.round(((statusCounts.answered + statusCounts.answered_marked) / questions.length) * 100)}%
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        {/* Submit Test Button (Always Visible) */}
        <Button
          onClick={handleSubmitTest}
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
          title="Submit Test"
        >
          <Send className="w-6 h-6" />
        </Button>

        {/* Toggle Question Palette */}
        <Button
          onClick={() => setShowQuestionPalette(!showQuestionPalette)}
          variant="outline"
          className="bg-white/90 backdrop-blur-xl border-gray-300 p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
          title="Toggle Question Palette"
        >
          {showQuestionPalette ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </div>

      {/* Warning Modal for Low Time */}
      {timeLeft <= 300 && timeLeft > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden max-w-md mx-4">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-1">
              <div className="bg-white rounded-3xl p-8 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Time Warning!</h3>
                <p className="text-gray-600 mb-6">
                  Only <span className="font-bold text-red-600">{formatTime(timeLeft)}</span> remaining!
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSubmitTest}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    Submit Now
                  </Button>
                  <Button
                    onClick={() => {/* Close modal */}}
                    variant="outline"
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Custom Styles */}
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
        
        /* Pulse animation for timer when low */
        @keyframes pulse-red {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-pulse-red {
          animation: pulse-red 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}