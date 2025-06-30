'use client'

export default function CheckEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Environment Variables Check</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Supabase URL:</h3>
          <div className="bg-white p-3 rounded border">
            {supabaseUrl ? (
              <div>
                <span className="text-green-600 font-semibold">✅ Found:</span>
                <p className="break-all text-sm mt-1">{supabaseUrl}</p>
              </div>
            ) : (
              <span className="text-red-600 font-semibold">❌ NOT FOUND</span>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Supabase Anon Key:</h3>
          <div className="bg-white p-3 rounded border">
            {supabaseKey ? (
              <div>
                <span className="text-green-600 font-semibold">✅ Found:</span>
                <p className="text-sm mt-1">Key length: {supabaseKey.length} characters</p>
                <p className="text-xs text-gray-500 mt-1">First 20 chars: {supabaseKey.substring(0, 20)}...</p>
              </div>
            ) : (
              <span className="text-red-600 font-semibold">❌ NOT FOUND</span>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Environment Info:</h3>
          <div className="bg-white p-3 rounded border">
            <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server Side'}</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-lg mb-2 text-blue-800">Next Steps:</h3>
          <div className="text-sm text-blue-700">
            {supabaseUrl && supabaseKey ? (
              <div>
                <p className="text-green-700 font-semibold">✅ Environment variables are loaded correctly!</p>
                <p className="mt-2">Now you can test the database connection at: <a href="/test-db" className="underline text-blue-600">/test-db</a></p>
              </div>
            ) : (
              <div>
                <p className="text-red-700 font-semibold">❌ Environment variables are missing!</p>
                <div className="mt-2">
                  <p>Please check:</p>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Is your <code>.env.local</code> file in the root directory?</li>
                    <li>Did you restart the dev server after adding variables?</li>
                    <li>Are the variable names correct?</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}