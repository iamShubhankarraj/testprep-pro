'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ResultsPage() {
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  const attemptId = searchParams.get('attemptId')
  const testId = searchParams.get('testId')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
              Test Completed Successfully! 🎉
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Your test has been submitted and results are being processed.
            </p>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-gray-700"><strong>Test ID:</strong> {testId}</p>
                <p className="text-gray-700"><strong>Attempt ID:</strong> {attemptId}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-green-800 font-semibold">✅ Test submitted successfully!</p>
                <p className="text-green-700">Your responses have been saved and are being analyzed.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/tests">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl">
                  Take Another Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}