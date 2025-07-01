'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  const params = useParams()
  const testId = params.testId as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Test #{testId}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">Test page coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
