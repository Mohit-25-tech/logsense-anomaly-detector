import { useState, useMemo, Fragment } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ChevronDown, ChevronRight, Fingerprint, Layers } from 'lucide-react'
import type { AnalysisResult } from '@/app/upload/page'

interface ResultsSectionProps {
  analysis: AnalysisResult
}

const LEVEL_COLORS: Record<string, string> = {
  ERROR: '#ef4444',
  WARNING: '#eab308',
  INFO: '#3b82f6',
  DEBUG: '#6b7280',
}

const LEVEL_BG: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WARNING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DEBUG: 'bg-gray-100 text-gray-700 dark:bg-zinc-700/50 dark:text-gray-400',
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
  const [fpFilter, setFpFilter] = useState<string>('ALL')
  const [expandedFp, setExpandedFp] = useState<Set<string>>(new Set())
  const { summary, ai_explanation, anomalies, trends, fingerprints = [] } = analysis

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
      .slice(0, 5)
  }, [anomalies])

  // Filtered fingerprints
  const filteredFingerprints = useMemo(() => {
    if (fpFilter === 'ALL') return fingerprints
    return fingerprints.filter(fp => fp.level === fpFilter)
  }, [fingerprints, fpFilter])

  // Deduplication ratio
  const dedupRatio = useMemo(() => {
    if (summary.total === 0 || fingerprints.length === 0) return 0
    return Math.round(((summary.total - fingerprints.length) / summary.total) * 100)
  }, [summary.total, fingerprints.length])

  const toggleExpand = (fpId: string) => {
    setExpandedFp(prev => {
      const next = new Set(prev)
      if (next.has(fpId)) next.delete(fpId)
      else next.add(fpId)
      return next
    })
  }

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
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700 max-h-28 overflow-y-auto">
              <p className="text-gray-800 dark:text-gray-300 font-mono text-xs break-words leading-relaxed">
                {ai_explanation.error_message || 'No error message'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Root Cause</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{ai_explanation.root_cause}</p>
            </div>
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

      {/* ── Fingerprints card ──────────────────────────────────── */}
      {fingerprints.length > 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-teal-500" />
              Log Fingerprints
              <span className="ml-2 text-sm font-normal text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2.5 py-0.5 rounded-full">
                {fingerprints.length} unique patterns
              </span>
            </h3>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  {dedupRatio}% noise reduction
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'].map(level => {
                  const count = level === 'ALL'
                    ? fingerprints.length
                    : fingerprints.filter(fp => fp.level === level).length
                  if (level !== 'ALL' && count === 0) return null
                  return (
                    <Button
                      key={level}
                      variant={fpFilter === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFpFilter(level)}
                      className={`rounded-full text-xs font-semibold ${
                        fpFilter === level
                          ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent'
                          : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {level} <span className="opacity-70 ml-1">({count})</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{fingerprints.length}</span> unique patterns detected from{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{summary.total.toLocaleString()}</span> total log lines
              {dedupRatio > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {' '}&mdash; {dedupRatio}% of logs are duplicates
                </span>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="pb-3 pr-2 pl-2 w-8"></th>
                  <th className="pb-3 pr-4 text-center w-20">Count</th>
                  <th className="pb-3 pr-4 w-24">Level</th>
                  <th className="pb-3 pr-4">Pattern</th>
                  <th className="pb-3 pr-4 w-40">Modules</th>
                  <th className="pb-3 w-48">Time Range</th>
                </tr>
              </thead>
              <tbody>
                {filteredFingerprints.slice(0, 50).map((fp) => {
                  const isExpanded = expandedFp.has(fp.fingerprint_id)
                  const levelBg = LEVEL_BG[fp.level] ?? LEVEL_BG.DEBUG

                  return (
                    <Fragment key={fp.fingerprint_id}>
                      <tr
                        onClick={() => toggleExpand(fp.fingerprint_id)}
                        className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 pr-2 pl-2 text-gray-400">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4 group-hover:text-teal-500 transition-colors" />
                          }
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-bold px-2.5 py-1 rounded-full">
                            {fp.count.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${levelBg}`}>
                            {fp.level}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-800 dark:text-gray-300 font-mono text-xs max-w-sm truncate" title={fp.pattern}>
                          {fp.pattern}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {fp.modules.slice(0, 3).map((mod, i) => (
                              <span key={i} className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                {mod}
                              </span>
                            ))}
                            {fp.modules.length > 3 && (
                              <span className="bg-gray-100 dark:bg-zinc-700 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                                +{fp.modules.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                          {fp.first_seen || '\u2014'}
                          {fp.first_seen && fp.last_seen && fp.first_seen !== fp.last_seen && (
                            <span className="text-gray-400 dark:text-gray-500"> \u2192 {fp.last_seen}</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/30">
                          <td colSpan={6} className="py-4 px-6">
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1.5">Sample Log Message</p>
                                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-3">
                                  <p className="text-gray-800 dark:text-gray-300 font-mono text-xs break-words leading-relaxed">
                                    {fp.sample_message}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                                <span>Fingerprint: <code className="text-teal-600 dark:text-teal-400 font-mono bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">{fp.fingerprint_id}</code></span>
                                <span>Modules: <span className="font-medium text-gray-700 dark:text-gray-300">{fp.modules.join(', ')}</span></span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
            {filteredFingerprints.length > 50 && (
              <p className="text-gray-500 text-xs mt-3">
                Showing 50 of {filteredFingerprints.length} fingerprints.
              </p>
            )}
            {filteredFingerprints.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-8 text-center py-8">
                No fingerprints found for level &quot;{fpFilter}&quot;.
              </p>
            )}
          </div>
        </Card>
      )}

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
                      <td className="py-3 pr-4 pl-3 text-gray-600 dark:text-gray-400 font-mono text-xs whitespace-nowrap">{a.timestamp || '\u2014'}</td>
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
                  )
                })}
              </tbody>
            </table>
            {filteredAnomalies.length > 50 && (
              <p className="text-gray-500 text-xs mt-3">
                Showing 50 of {filteredAnomalies.length} anomalies.
              </p>
            )}
            {filteredAnomalies.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-8 text-center py-8">
                No anomalies found for level &quot;{filter}&quot;.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
