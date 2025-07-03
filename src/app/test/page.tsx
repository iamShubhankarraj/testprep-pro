'use client' // This directive is necessary for client-side functionality like Link and Button

import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui button
import { PlusCircle, List, ArrowLeft } from 'lucide-react';

export default function TestsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              All Available Tests
            </h1>
            <p className="text-lg text-gray-300">
              Browse and manage your test papers.
            </p>
          </div>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl px-5 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <Link href="/test/create">
            <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Test
            </Button>
          </Link>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/20 hover:text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg">
            <List className="w-5 h-5 mr-2" />
            View My Tests
          </Button>
        </div>

        {/* Placeholder for Test List (will be populated later) */}
        <div className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Tests Available Yet</h2>
          <p className="text-gray-300 mb-6">
            Start by creating a new test or uploading a PDF to generate questions.
          </p>
          <Link href="/test/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl">
              Create First Test
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
