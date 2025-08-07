'use client'

import { Suspense } from 'react'
import ResultsContent from './results-content'

// Loading component for Suspense
function ResultsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="relative w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 text-xl font-medium">Loading results...</p>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsContent />
    </Suspense>
  )
}