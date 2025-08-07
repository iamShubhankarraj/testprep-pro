// src/app/dashboard/results/page.tsx
'use client'

import { Suspense } from 'react'
import ResultsContent from './results-content'
import { Loader2 } from 'lucide-react'

// Loading fallback component
function ResultsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading your results...</p>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsContent />
    </Suspense>
  )
}