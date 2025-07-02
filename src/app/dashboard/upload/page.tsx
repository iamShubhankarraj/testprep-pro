'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase' // Assuming you have this client setup

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        setUploadSuccess(null)
        setMessage('')
      } else {
        setSelectedFile(null)
        setUploadSuccess(false)
        setMessage('Please select a PDF file.')
      }
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true) // Keep dragging state true while over the zone
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files)
  }, [])

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.')
      return
    }

    setUploading(true)
    setUploadSuccess(null)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated. Please log in.')
      }

      // Generate a unique file name to avoid collisions and organize by user ID
      const storagePath = `user_uploads/${user.id}/${Date.now()}-${selectedFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-materials') // IMPORTANT: Ensure this bucket name matches your Supabase Storage bucket
        .upload(storagePath, selectedFile, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: false, // Do not overwrite if file with same name exists
        })

      if (uploadError) {
        throw uploadError
      }

      // Now, record the upload metadata in your 'pdfs' table
      const { error: dbError } = await supabase
        .from('pdfs') // Your 'pdfs' table
        .insert([
          {
            user_id: user.id,
            file_name: selectedFile.name,
            storage_path: uploadData.path, // This is the path inside the bucket
            title: selectedFile.name.split('.').slice(0, -1).join('.'), // Use filename as title, remove extension
            file_size: selectedFile.size,
            upload_date: new Date().toISOString(), // Use current date for upload_date
            processing_status: 'pending', // Initial status
          },
        ])
        .select(); // Use .select() to get the inserted data, useful for debugging

      if (dbError) {
        // If DB insert fails, try to delete the uploaded file from storage to prevent orphaned files
        console.error('Error saving PDF metadata to DB, attempting to remove file from storage:', dbError);
        await supabase.storage.from('study-materials').remove([uploadData.path]);
        throw dbError;
      }

      setUploadSuccess(true)
      setMessage('File uploaded and recorded successfully! Processing will begin shortly.')
      setSelectedFile(null) // Clear selected file after successful upload
      console.log('Uploaded file data in storage:', uploadData)
      console.log('Inserted PDF metadata into DB.')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadSuccess(false)
      setMessage(`Upload failed: ${errorMessage}`)
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated background elements for extra flair */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Upload Your Study Material
            </h1>
            <p className="text-lg text-gray-300">
              Transform your PDFs into powerful test-generating resources.
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

        {/* Upload Card */}
        <Card className="bg-white/10 backdrop-blur-3xl border-white/20 rounded-3xl shadow-2xl p-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-3xl font-bold">PDF Uploader</CardTitle>
            <p className="text-gray-300 text-md">Securely upload your documents for AI processing.</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div
              className={`border-4 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ease-in-out
                ${isDragging ? 'border-purple-500 bg-purple-900/30 shadow-purple-500/50 scale-105' : 'border-blue-500/50 bg-slate-800/50'}
                hover:border-blue-400 hover:bg-slate-700/50 hover:shadow-lg
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
                id="file-upload-input"
              />
              <Upload className="w-16 h-16 text-blue-400 mx-auto mb-6 animate-bounce-slow" />
              <p className="text-white/90 text-xl font-semibold mb-4">
                Drag & Drop your PDF here, or
              </p>
              <label htmlFor="file-upload-input">
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <span>
                    <FileText className="w-5 h-5 mr-2" />
                    Browse Files
                  </span>
                </Button>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-5 bg-white/15 rounded-xl border border-white/20 shadow-md animate-fade-in">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-purple-400 mr-3" />
                  <span className="text-white text-lg font-medium truncate max-w-xs">{selectedFile.name}</span>
                  <span className="text-gray-400 text-sm ml-3">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:bg-red-500/20 rounded-full"
                  title="Remove file"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            )}

            {message && (
              <div
                className={`flex items-center p-4 rounded-xl shadow-md animate-fade-in ${
                  uploadSuccess ? 'bg-green-500/20 text-green-300 border border-green-400' : 'bg-red-500/20 text-red-300 border border-red-400'
                }`}
              >
                {uploadSuccess ? (
                  <CheckCircle className="w-6 h-6 mr-3" />
                ) : (
                  <XCircle className="w-6 h-6 mr-3" />
                )}
                <p className="text-lg font-medium">{message}</p>
              </div>
            )}

            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-4 px-6 rounded-xl text-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Start Upload'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
