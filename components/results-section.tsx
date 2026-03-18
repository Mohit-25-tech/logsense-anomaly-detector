import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { AnalysisResult } from '@/app/page'

interface ResultsSectionProps {
  analysis: AnalysisResult
}

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

export default function ResultsSection({ analysis }: ResultsSectionProps) {
  const [filter, setFilter] = useState<string>('ALL')
  const { summary, ai_explanation, anomalies, trends } = analysis

  const chartData = (Object.keys(trends) as Array<keyof typeof trends>).map((key) => ({
    name: key,
    value: trends[key],
    color: LEVEL_COLORS[key] ?? '#6b7280',
  }))

  const severityClass =
    SEVERITY_CLASS[ai_explanation.severity?.toUpperCase()] ?? SEVERITY_CLASS.UNKNOWN

  // Filtering Anomalies
  const filteredAnomalies = useMemo(() => {
    if (filter === 'ALL') return anomalies
    return anomalies.filter(a => a.level === filter)
  }, [anomalies, filter])

  // Top Error Patterns (Group ERRORs by module)
  const topErrorPatterns = useMemo(() => {
    const errors = anomalies.filter(a => a.level === 'ERROR')
    const counts: Record<string, number> = {}
    errors.forEach(err => {
      counts[err.module] = (counts[err.module] || 0) + 1
    })
    return Object.entries(counts)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5
  }, [anomalies])

  return (
    <div className="mb-20">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Analysis Results</h2>

      {/* ── Top 3 cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Card 1 — Log Summary */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Log Summary</h3>
          <div className="space-y-5">
            {[
              { label: 'Total Lines', value: summary.total, color: 'text-teal-400' },
              { label: 'Errors',      value: summary.errors,   color: 'text-red-500' },
              { label: 'Warnings',   value: summary.warnings, color: 'text-yellow-500' },
              { label: 'Info',       value: summary.info,     color: 'text-blue-500' },
              { label: 'Debug',      value: summary.debug,    color: 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-4xl font-bold ${color}`}>{value}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2 — AI Explanation */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">AI Explanation</h3>
          <div className="space-y-4">
            {/* Error message code block */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700 max-h-28 overflow-y-auto">
              <p className="text-gray-800 dark:text-gray-300 font-mono text-xs break-words leading-relaxed">
                {ai_explanation.error_message || 'No error message'}
              </p>
            </div>

            {/* Root cause */}
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Root Cause</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{ai_explanation.root_cause}</p>
            </div>

            {/* Fix steps */}
            {ai_explanation.fix_steps?.length > 0 && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2">Fix Steps</p>
                <ol className="space-y-1">
                  {ai_explanation.fix_steps.map((step, i) => (
                    <li key={i} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2">
                      <span className="text-teal-600 dark:text-teal-500 font-bold shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Severity badge */}
            <div className="pt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${severityClass}`}>
                {ai_explanation.severity || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3 — Trends Chart */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Log Level Trends</h3>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.9)',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Error Patterns Grouping */}
          {topErrorPatterns.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800">
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-3">
                Top Error Patterns
              </p>
              <div className="flex flex-wrap gap-2">
                {topErrorPatterns.map((pattern, i) => (
                  <div key={i} className="flex items-center bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-full px-3 py-1">
                    <span className="text-teal-700 dark:text-teal-300 text-xs font-medium mr-2 max-w-[120px] truncate" title={pattern.module}>
                      {pattern.module}
                    </span>
                    <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pattern.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Anomalies card (shown only when anomalies exist) ────── */}
      {anomalies.length > 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              🚨 Detected Anomalies
              <span className="ml-3 text-sm font-normal text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
                {filteredAnomalies.length} flagged
              </span>
            </h3>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'ALL', count: anomalies.length },
                { label: 'ERROR', count: summary.errors },
                { label: 'WARNING', count: summary.warnings },
                { label: 'INFO', count: summary.info },
                { label: 'DEBUG', count: summary.debug }
              ].map(f => (
                <Button
                  key={f.label}
                  variant={filter === f.label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f.label)}
                  className={`rounded-full text-xs font-semibold ${
                    filter === f.label 
                      ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent' 
                      : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {f.label} <span className="opacity-70 ml-1">({f.count})</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="pb-3 pr-4 pl-4">Timestamp</th>
                  <th className="pb-3 pr-4">Level</th>
                  <th className="pb-3 pr-4">Module</th>
                  <th className="pb-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalies.slice(0, 50).map((a, i) => {
                  const isError = a.level === 'ERROR'
                  const isWarn = a.level === 'WARNING'
                  const borderClass = isError ? 'border-l-4 border-l-red-500' : isWarn ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-transparent'

                  return (
                    <tr key={i} className={`border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${borderClass}`}>
                      <td className="py-3 pr-4 pl-3 text-gray-600 dark:text-gray-400 font-mono text-xs whitespace-nowrap">{a.timestamp || '—'}</td>
                      <td className="py-3 pr-4">
                      <span
                        style={{ color: LEVEL_COLORS[a.level] ?? '#9ca3af' }}
                        className="font-semibold"
                      >
                        {a.level}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{a.module}</td>
                    <td className="py-3 text-gray-800 dark:text-gray-300 break-words max-w-xs">{a.message}</td>
                  </tr>
                )})}
              </tbody>
            </table>
            {filteredAnomalies.length > 50 && (
              <p className="text-gray-500 text-xs mt-3">
                Showing 50 of {filteredAnomalies.length} anomalies.
              </p>
            )}
            {filteredAnomalies.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-8 text-center py-8">
                No anomalies found for level "{filter}".
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

