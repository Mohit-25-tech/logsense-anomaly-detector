'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navbar from '@/components/navbar'
import { Activity, ShieldAlert, Cpu, BarChart3, ArrowRight, Fingerprint, Network } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('logSenseAnalysis')
      localStorage.removeItem('logSenseFileName')
      localStorage.removeItem('logSenseFileSize')
      localStorage.removeItem('logSenseDate')
    }
  }, [])

  const features = [
    {
      title: 'Automated Anomaly Detection',
      description: 'Instantly identify irregularities and unexpected patterns in your log sequences.',
      icon: <Activity className="w-8 h-8 text-teal-500" />,
    },
    {
      title: 'AI Root Cause Analysis',
      description: 'Leverage LLMs to understand the core reason behind errors and receive actionable fix steps.',
      icon: <Cpu className="w-8 h-8 text-teal-500" />,
    },
    {
      title: 'Severity Scoring',
      description: 'Quickly prioritize critical issues with intelligently assigned severity levels.',
      icon: <ShieldAlert className="w-8 h-8 text-teal-500" />,
    },
    {
      title: 'Actionable Reporting',
      description: 'Export clean, comprehensive reports detailing trends, anomalies, and AI diagnostics.',
      icon: <BarChart3 className="w-8 h-8 text-teal-500" />,
    },
    {
      title: 'Log Deduplication',
      description: 'Intelligently group duplicate log entries using fingerprinting to cut through noise and surface unique patterns.',
      icon: <Fingerprint className="w-8 h-8 text-teal-500" />,
    },
    {
      title: 'Cross-Service Correlation',
      description: 'Upload multiple logs to discover cascading failures and view unified timelines across your entire stack.',
      icon: <Network className="w-8 h-8 text-teal-500" />,
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden transition-colors duration-300 flex flex-col">
      <Navbar />

      {/* Background gradient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/5 dark:bg-teal-600/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center rounded-full border border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 text-sm font-medium text-teal-800 dark:text-teal-300 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 mr-2 animate-pulse"></span>
            Next-Generation Log Analysis
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Make Sense of Your{' '}
            <span className="bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
              Log Data
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transform raw server logs into actionable insights with AI-driven anomaly detection and root cause analysis.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push('/upload')}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-teal-500/25 flex items-center gap-2 group w-full sm:w-auto transition-transform hover:scale-105"
            >
              Analyze Logs Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="rounded-full px-8 py-6 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-lg font-medium w-full sm:w-auto"
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="w-full max-w-6xl mx-auto mt-32">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Powerful Features for Modern Diagnostics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-gray-200 dark:border-zinc-800 p-8 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-colors duration-300 shadow-sm"
              >
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
