'use client'
import 'katex/dist/katex.min.css';
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase' // Ensure this path is correct
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Flag,
  Send,
  AlertCircle
} from 'lucide-react'
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.js'; // For auto-rendering LaTeX

// --- Interfaces (matching your Supabase schema) ---

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

// Represents a question as it appears in the test, with its order
interface TestQuestionWithDetails {
  id: string; // ID from test_questions table
  question_order: number;
  questions: Question; // Joined question details
}

// --- KaTeX Renderer Component ---
// This component will render LaTeX strings using KaTeX
const KatexRenderer: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Clear previous content to prevent duplicate rendering issues
      ref.current.innerHTML = text; 
      // Use auto-render to process all LaTeX within the element
      // Delimiters are for inline and block math
      renderMathInElement(ref.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }, [text]); // Re-render if the text changes

  return <div ref={ref} />; // Render an empty div and let KaTeX populate it
};


// --- Main Component ---

export default function TestTakingPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string // Get testId from URL
  const [user, setUser] = useState<{ id: string } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [test, setTest] = useState<TestDefinition | null>(null)
  const [questions, setQuestions] = useState<TestQuestionWithDetails[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map()) // Map<questionId, userAnswer>
  const [timeLeft, setTimeLeft] = useState(0) // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [testAttemptId, setTestAttemptId] = useState<string | null>(null) // ID of the current test attempt

  // Function to format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // --- Core Logic: Fetching Data and Starting Test Attempt ---
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

        // 1. Fetch Test Definition
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError || !testData) {
          throw new Error(testError?.message || 'Test not found.');
        }
        setTest(testData);
        setTimeLeft(testData.duration_minutes * 60); // Initialize timer

        // 2. Fetch Questions for this Test
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

       // Filter out any null 'questions' objects that might result from join issues
const validQuestions = testQuestionsData.filter(tq => tq.questions !== null) as unknown as TestQuestionWithDetails[];

// DEBUG: Log what we're getting
console.log('🔍 Raw test questions data:', testQuestionsData);
console.log('✅ Valid questions after filtering:', validQuestions);
console.log('📊 Number of questions found:', validQuestions.length);

setQuestions(validQuestions);
        // 3. Create a new Test Attempt record
        const { data: attemptData, error: attemptError } = await supabase
          .from('test_attempts')
          .insert([
            {
              user_id: supabaseUser.id,
              test_id: testId,
              started_at: new Date().toISOString(),
              total_questions: testData.total_questions,
              max_possible_score: testData.total_questions * 4, // Assuming +4 for correct
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

    // Cleanup function for useEffect
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testId, router]); // Depend on testId and router

  // --- Timer Logic ---
  useEffect(() => {
    if (!loading && timeLeft > 0 && testAttemptId) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            handleSubmitTest(); // Automatically submit when time runs out
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && !loading && testAttemptId) {
        handleSubmitTest(); // Ensure submission if time is 0 on load
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading, timeLeft, testAttemptId]); // Re-run if loading state changes or timeleft hits 0, or attempt starts

  // --- Test Navigation & Answer Handling ---

  const handleAnswerSelect = (questionId: string, option: string) => {
    setUserAnswers(prev => new Map(prev).set(questionId, option));
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

    setLoading(true); // Indicate submission is in progress
    setError(null);

    try {
      // For Milestone 2.1, we'll just log and update status.
      // Full scoring will be in Milestone 2.2.

      // Update the test_attempts record to 'completed'
      const { error: updateError } = await supabase
        .from('test_attempts')
        .update({
          completed_at: new Date().toISOString(),
          time_taken_minutes: test.duration_minutes - Math.floor(timeLeft / 60), // Time spent
          status: 'completed',
          // score, correct_answers, incorrect_answers, raw_score will be updated in M2.2
        })
        .eq('id', testAttemptId)
        .eq('user_id', user.id); // Ensure user owns the attempt

      if (updateError) {
        throw updateError;
      }

      // Log user answers for now
      console.log('User Answers:', Array.from(userAnswers.entries()));
      console.log('Test submitted successfully (basic status update).');

      // Redirect to a results or dashboard page
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          Loading test...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-red-900/20 backdrop-blur-3xl border-red-500/50 text-red-300 rounded-3xl shadow-2xl p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <CardTitle className="text-white text-2xl font-bold mb-4">Error Loading Test</CardTitle>
          <CardContent>
            <p className="text-lg mb-6">{error}</p>
            <Link href="/dashboard/tests">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl">
                Back to Tests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 text-white rounded-3xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <CardTitle className="text-white text-2xl font-bold mb-4">Test Not Found or Empty</CardTitle>
          <CardContent>
            <p className="text-lg mb-6">The test you are trying to access does not exist or has no questions.</p>
            <Link href="/dashboard/tests">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
                Browse Other Tests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]?.questions;
  const currentTestQuestionId = questions[currentQuestionIndex]?.id; // ID from test_questions table

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 text-white rounded-3xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <CardTitle className="text-white text-2xl font-bold mb-4">Question Not Found</CardTitle>
          <CardContent>
            <p className="text-lg mb-6">The current question could not be loaded.</p>
            <Link href="/dashboard/tests">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
                Back to Tests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-5xl mx-auto py-8">
        {/* Test Header & Timer */}
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-2xl shadow-xl mb-6 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{test.title}</h1>
            <p className="text-gray-300 text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <span className="text-white text-2xl font-bold">{formatTime(timeLeft)}</span>
          </div>
        </Card>

        {/* Question Progress Bar */}
        <Progress
          value={((currentQuestionIndex + 1) / questions.length) * 100}
          className="h-2 bg-white/20 mb-6"
        />

        {/* Question Card */}
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl p-8 mb-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-xl font-semibold mb-4">
              <KatexRenderer text={currentQuestion.question_text} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
              value={userAnswers.get(currentQuestion.id) || ''}
              className="space-y-4"
            >
              {['A', 'B', 'C', 'D'].map((optionKey) => {
                const optionText = currentQuestion[`option_${optionKey.toLowerCase()}` as keyof Question];
                return (
                  <div key={optionKey} className="flex items-center space-x-3 p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
                    <RadioGroupItem value={optionKey} id={`option-${optionKey}`} className="text-blue-400 border-blue-400 focus:ring-blue-500" />
                    <Label htmlFor={`option-${optionKey}`} className="text-white text-lg flex-1 cursor-pointer">
                      <span className="font-bold mr-2">{optionKey}.</span>
                      <KatexRenderer text={String(optionText || '')} />
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation and Submit Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 hover:text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg"
            >
              <Flag className="w-5 h-5 mr-2" />
              Mark for Review
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitTest}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Send className="w-5 h-5 mr-2" />
                Submit Test
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
