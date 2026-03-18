'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import jsPDF from 'jspdf'
import * as htmlToImage from 'html-to-image'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts'
import { Printer, ArrowLeft, Download, Loader2, AlertTriangle, Info, FileText, CheckCircle2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navbar from '@/components/navbar'
import { LogSenseLogo } from '@/components/logo'
import type { AnalysisResult } from '@/app/page'

const LEVEL_COLORS: Record<string, string> = {
  ERROR: '#ef4444',
  WARNING: '#eab308',
  INFO: '#3b82f6',
  DEBUG: '#6b7280',
}

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: 'bg-red-900 text-red-100',
  HIGH: 'bg-orange-900 text-orange-100',
  MEDIUM: 'bg-yellow-900 text-yellow-100',
  LOW: 'bg-green-900 text-green-100',
  UNKNOWN: 'bg-zinc-700 text-zinc-200',
}

export default function ReportPage() {
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [analysisDate, setAnalysisDate] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem('logSenseAnalysis')
    const fname = localStorage.getItem('logSenseFileName')
    const date = localStorage.getItem('logSenseDate')
    
    if (!data) {
      router.push('/')
      return
    }

    setAnalysis(JSON.parse(data))
    setFileName(fname || 'Unknown File')
    setAnalysisDate(date ? new Date(date).toLocaleString() : new Date().toLocaleString())
  }, [router])

  if (!analysis) return null

  const { summary, ai_explanation, anomalies, trends } = analysis

  const chartData = (Object.keys(trends) as Array<keyof typeof trends>).map((key) => ({
    name: key,
    value: trends[key],
    color: LEVEL_COLORS[key] ?? '#6b7280',
  }))

  const severityClass = SEVERITY_CLASS[ai_explanation.severity?.toUpperCase()] ?? SEVERITY_CLASS.UNKNOWN

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return
    
    try {
      setIsGeneratingPdf(true)
      
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        pixelRatio: 2, // Higher quality
        backgroundColor: '#ffffff'
      })
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      
      // We need to calculate the height based on the DOM element's aspect ratio
      const domRect = reportRef.current.getBoundingClientRect()
      const imgHeight = (domRect.height * imgWidth) / domRect.width
      
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add remaining pages if content overflows A4
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save('LogSense-Report.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white pb-20 print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-12">
        {/* Buttons (Hidden in print) */}
        <div className="flex justify-between items-center mb-10 print:hidden">
          <Button variant="outline" asChild className="rounded-full border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
          </Button>
          <Button 
            onClick={handleDownloadPdf} 
            disabled={isGeneratingPdf}
            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white min-w-[160px]"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </>
            )}
          </Button>
        </div>

        <div ref={reportRef} className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {/* BEAUTIFUL HEADER */}
          <div className="bg-gradient-to-br from-teal-900 via-zinc-900 to-zinc-950 text-white p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <LogSenseLogo className="w-12 h-12" />
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mt-2">
                  LogSense Diagnostic Report
                </h1>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Target File</p>
                  <p className="font-semibold text-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" /> {fileName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Generated At</p>
                  <p className="font-semibold text-gray-100">{analysisDate}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Analyzed Lines</p>
                  <p className="font-semibold text-gray-100">{summary.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Overall Health</p>
                  <p className="font-semibold flex items-center gap-2">
                    {summary.errors > 0 ? (
                      <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Critical</span>
                    ) : (
                      <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Healthy</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-12 bg-gray-50/50 dark:bg-zinc-950/50">
            {/* SECTION 1: Executive Summary */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
                <Info className="w-5 h-5 text-teal-500" /> Executive Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Logs', value: summary.total, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-100 dark:border-teal-900/30' },
                  { label: 'Errors', value: summary.errors, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-100 dark:border-red-900/30' },
                  { label: 'Warnings', value: summary.warnings, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-100 dark:border-orange-900/30' },
                  { label: 'Info / Debug', value: summary.info + summary.debug, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-900/30' },
                ].map((stat, i) => (
                  <Card key={i} className={`p-6 ${stat.bg} ${stat.border} shadow-sm transition-all hover:shadow-md`}>
                    <p className={`text-4xl font-black mb-2 ${stat.color}`}>{stat.value.toLocaleString()}</p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* SECTION 2: AI Explanation */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
                  <Terminal className="w-5 h-5 text-teal-500" /> AI Diagnostic
                </h2>
                <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-6 h-full shadow-sm flex flex-col justify-center">
                  <div className="mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800`}>
                      Severity: {ai_explanation.severity || 'UNKNOWN'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Detected Error Signature</h4>
                  <div className="bg-zinc-900 text-red-300 p-4 rounded-xl border border-zinc-800 font-mono text-xs leading-relaxed break-words shadow-inner">
                    {ai_explanation.error_message || 'No specific error message cleanly extracted.'}
                  </div>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 h-full shadow-sm">
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Root Cause Analysis
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base pt-2">
                      {ai_explanation.root_cause}
                    </p>
                  </div>

                  {ai_explanation.fix_steps?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Recommended Resolution Steps</h4>
                      <div className="space-y-3">
                        {ai_explanation.fix_steps.map((step, i) => (
                          <div key={i} className="flex gap-4 items-start bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </section>

            {/* SECTION 3: Log Level Trends */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
                <BarChart className="w-5 h-5 text-teal-500" /> System Trends
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={11} stroke="#6b7280" tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} stroke="#6b7280" tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', backgroundColor: '#18181b', color: '#fff', border: 'none' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm h-[320px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#18181b', color: '#fff', border: 'none' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-4">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{summary.total}</span>
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Logs</span>
                  </div>
                </Card>
              </div>
            </section>

            {/* SECTION 4: Recommendations */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> Recommendations
              </h2>
              <Card className="bg-teal-500/5 dark:bg-teal-900/10 border border-teal-500/20 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-teal-500/10">
                  <div className="p-6 hover:bg-teal-500/5 transition-colors">
                    <h5 className="font-bold text-teal-900 dark:text-teal-400 mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-teal-200 dark:bg-teal-900 flex items-center justify-center text-xs">1</div> Log Rotation</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Ensure proper log rotation is configured to prevent disk space exhaustion from continuously growing output logs.</p>
                  </div>
                  <div className="p-6 hover:bg-teal-500/5 transition-colors">
                    <h5 className="font-bold text-teal-900 dark:text-teal-400 mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-teal-200 dark:bg-teal-900 flex items-center justify-center text-xs">2</div> Connection Pooling</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Review database and API connection pooling settings. Recurring timeout errors often stem from pool exhaustion.</p>
                  </div>
                  <div className="p-6 hover:bg-teal-500/5 transition-colors">
                    <h5 className="font-bold text-teal-900 dark:text-teal-400 mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-teal-200 dark:bg-teal-900 flex items-center justify-center text-xs">3</div> Active Alerting</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">Establish automated Slack/Email alerts for any subsequent logs matching the ERROR severity to catch future outages.</p>
                  </div>
                </div>
              </Card>
            </section>

            {/* SECTION 5: Detected Anomalies */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 text-teal-500" /> Detected Anomalies
              </h2>
              {anomalies.length > 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
                        <tr className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-6">Timestamp</th>
                          <th className="py-4 px-6">Level</th>
                          <th className="py-4 px-6">Module</th>
                          <th className="py-4 px-6">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomalies.map((a, i) => {
                          const isError = a.level === 'ERROR'
                          const isWarn = a.level === 'WARNING'
                          const badgeBg = isError ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : isWarn ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'

                          return (
                            <tr key={i} className="border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">{a.timestamp || '—'}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${badgeBg}`}>
                                  {a.level}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-gray-600 dark:text-gray-300 font-mono text-[11px]">{a.module}</td>
                              <td className="py-4 px-6 text-gray-800 dark:text-gray-200 break-words">{a.message}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic p-6 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">No anomalies detected in this log file.</p>
              )}
            </section>
          </div>

          {/* FOOTER */}
          <div className="bg-zinc-900 text-center py-6 text-xs text-zinc-500 tracking-wider">
            LogSense Automated Diagnostic Report • Generated {analysisDate}
          </div>
        </div>
      </main>
    </div>
  )
}
