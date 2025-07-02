'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDB() {
  const [status, setStatus] = useState('Testing connection...')
  const [subjects, setSubjects] = useState<{id: number, name: string}[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    testConnection()
  }, [])

  async function testConnection() {
    try {
      console.log('Testing Supabase connection...')
      
      // Check if environment variables are set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url_here') {
        setError('❌ Supabase credentials not configured. Please update your .env.local file with your actual Supabase project URL and anon key.')
        setStatus('❌ Configuration Error')
        return
      }
      
      // First, test basic connection
      const { error: connectionError } = await supabase
        .from('subjects')
        .select('*')
        .limit(1)

      if (connectionError) {
        console.error('Connection error:', connectionError)
        setError(`Connection failed: ${connectionError.message}`)
        setStatus('❌ Connection failed')
        return
      }

      console.log('Basic connection successful')

      // Now get all subjects
      const { data: allSubjects, error: fetchError } = await supabase
        .from('subjects')
        .select('*')

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        setError(`Fetch failed: ${fetchError.message}`)
        setStatus('❌ Fetch failed')
        return
      }

      console.log('All subjects:', allSubjects)
      setSubjects(allSubjects || [])
      setStatus('✅ Database connection working!')
      
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`Unexpected error: ${err}`)
      setStatus('❌ Unexpected error')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className={`p-4 rounded-lg mb-6 ${
        status.includes('✅') ? 'bg-green-100 text-green-800' : 
        status.includes('❌') ? 'bg-red-100 text-red-800' : 
        'bg-blue-100 text-blue-800'
      }`}>
        <h2 className="font-semibold">{status}</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-6">
          <h3 className="font-semibold">Error Details:</h3>
          <p className="text-sm mt-2">{error}</p>
          {error.includes('credentials not configured') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800">How to fix:</h4>
              <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside space-y-1">
                <li>Go to your Supabase project dashboard</li>
                <li>Copy your project URL and anon key</li>
                <li>Update the .env.local file with your actual credentials</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {subjects.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Subjects Found:</h3>
          <ul className="space-y-2">
            {subjects.map((subject) => (
              <li key={subject.id} className="flex justify-between">
                <span>{subject.name}</span>
                <span className="text-gray-500">ID: {subject.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}