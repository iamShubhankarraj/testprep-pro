// src/app/dashboard/results/page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, Target } from 'lucide-react'
import Link from 'next/link'

export default function ResultsPage() {
  const results = [
    { id: 1, test: "Math Quiz #1", score: 85, totalQuestions: 20, date: "2024-12-15", duration: "15 min" },
    { id: 2, test: "Science Test", score: 92, totalQuestions: 25, date: "2024-12-14", duration: "20 min" },
    { id: 3, test: "History Quiz", score: 78, totalQuestions: 15, date: "2024-12-13", duration: "12 min" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Test Results</h1>
            <p className="text-gray-300">Review your test performance</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-gray-400 text-gray-400 hover:bg-gray-700 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              back to the center 
            </Button>
          </Link>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {results.map((result) => (
            <Card key={result.id} className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">{result.test}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Score</span>
                  <span className="text-2xl font-bold text-gray-400">{result.score}%</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    {Math.round((result.score / 100) * result.totalQuestions)}/{result.totalQuestions} correct
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {result.duration}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {result.date}
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full"
                    style={{ width: `${result.score}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
