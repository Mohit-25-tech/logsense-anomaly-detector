'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import UploadZone from '@/components/upload-zone'
import ResultsSection from '@/components/results-section'
import Navbar from '@/components/navbar'

const BACKEND_URL = 'http://localhost:5000'

// Shape returned by GET /analyze
export interface AnalysisResult {
  summary: {
    total: number
    errors: number
    warnings: number
    info: number
    debug: number
  }
  ai_explanation: {
    error_message: string
    root_cause: string
    fix_steps: string[]
    severity: string
  }
  anomalies: Array<{
    timestamp: string
    level: string
    module: string
    message: string
  }>
  trends: {
    ERROR: number
    WARNING: number
    INFO: number
    DEBUG: number
  }
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileDrop = (droppedFile: File) => {
    setFile(droppedFile)
    setAnalysis(null)
    setError(null)
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setAnalysis(null)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      // ── Step 1: Upload file to Flask ──────────────────────────────
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}))
        throw new Error(errData.error || `Upload failed (${uploadRes.status})`)
      }

      // ── Step 2: Fetch analysis from Flask ─────────────────────────
      const analyzeRes = await fetch(`${BACKEND_URL}/analyze`)

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}))
        throw new Error(errData.error || `Analysis failed (${analyzeRes.status})`)
      }

      const data: AnalysisResult = await analyzeRes.json()
      setAnalysis(data)
      // Save data for the Report page
      localStorage.setItem('logSenseAnalysis', JSON.stringify(data))
      localStorage.setItem('logSenseFileName', file.name)
      localStorage.setItem('logSenseDate', new Date().toISOString())
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
      <Navbar />

      {/* Background gradient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/5 dark:bg-teal-600/10 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pt-12 text-gray-900 border-zinc-800 px-4">
        {/* Hero */}
        <div className={`w-full max-w-2xl transition-all duration-500 ${analysis ? 'mb-8' : 'mb-16 mt-12'}`}>
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-teal-300 to-teal-500 bg-clip-text text-transparent">
              LogSense
            </span>
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
            Analyze your logs with AI-powered insights
          </p>

          {/* File selected state */}
          {file ? (
            <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-12 text-center animate-in zoom-in duration-300 shadow-sm border">
              {!loading && !analysis && (
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-500">
                    <Check className="w-8 h-8" />
                  </div>
                </div>
              )}
              
              <p className="text-gray-900 dark:text-white text-xl font-semibold mb-2">
                {file.name}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                {(file.size / 1024).toFixed(1)} KB
              </p>

              {loading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Analyzing your logs...</p>
                </div>
              ) : !analysis ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleAnalyze}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg rounded-full px-8 py-6 text-lg font-semibold w-full sm:w-auto"
                  >
                    Analyze Now
                  </Button>
                  <Button
                    onClick={() => { setFile(null); setAnalysis(null); setError(null) }}
                    variant="outline"
                    className="rounded-full px-8 py-6 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-lg font-medium w-full sm:w-auto"
                  >
                    Change File
                  </Button>
                </div>
              ) : null}

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-300 text-sm font-medium">
                  ⚠ {error}
                </div>
              )}
            </Card>
          ) : (
            <UploadZone onFileDrop={handleFileDrop} onBrowse={handleBrowse} />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Results */}
        {analysis && (
          <div className="w-full max-w-6xl pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-100">
            <ResultsSection analysis={analysis} />
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => router.push('/report')}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setFile(null)
                  setAnalysis(null)
                  setError(null)
                }}
                variant="outline"
                className="rounded-full px-8 py-6 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-lg font-medium"
              >
                Clear / Upload New File
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
