// src/app/dashboard/tests/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Test {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  total_questions: number
  subject_ids: number[]
  difficulty_level: 'easy' | 'medium' | 'hard' | 'mixed'
  created_at: string
  is_active: boolean
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Checking authentication...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      
      if (!user) {
        console.error('❌ No user found')
        throw new Error('Not authenticated - please log in')
      }

      console.log('✅ User authenticated:', user.id)

      // First, let's check if the tests table exists and what columns it has
      console.log('🔍 Fetching tests from database...')
      const { data, error: fetchError } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Database error:', fetchError)
        throw new Error(`Database error: ${fetchError.message} (Code: ${fetchError.code})`)
      }

      console.log('✅ Raw data from database:', data)
      console.log('📊 Number of tests found:', data?.length || 0)

      setTests(data || [])
    } catch (err) {
      console.error('❌ Error in fetchTests:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading tests...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Tests</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={fetchTests} variant="outline">
                  Try Again
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>If this error persists, check:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Your internet connection</li>
                    <li>Database permissions</li>
                    <li>Authentication status</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Tests</h1>
          <p className="text-muted-foreground">
            Manage and take your practice tests
          </p>
        </div>
        <Link href="/test/create">
          <Button>Create New Test</Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first test to get started with practice
              </p>
              <Link href="/test/create">
                <Button>Create Your First Test</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <Badge variant={test.is_active ? "default" : "secondary"}>
                    {test.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {test.description && (
                  <CardDescription>{test.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{test.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>{test.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <Badge variant="outline" className="text-xs">
                      {test.difficulty_level}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(test.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Link href={`/test/${test.id}/start`} className="flex-1">
                    <Button className="w-full" disabled={!test.is_active}>
                      Start Test
                    </Button>
                  </Link>
                  <Link href={`/test/${test.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}