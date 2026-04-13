import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GitBranch, AlertTriangle, ArrowRight, Clock, Server, Filter } from 'lucide-react'
import type { AnalysisResult } from '@/app/upload/page'

// Auto-assigned color palette for sources
const SOURCE_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500', accent: '#3b82f6' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500', accent: '#8b5cf6' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500', accent: '#f59e0b' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', accent: '#10b981' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500', accent: '#f43f5e' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', dot: 'bg-cyan-500', accent: '#06b6d4' },
]

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-red-600 dark:text-red-400',
  WARNING: 'text-orange-600 dark:text-orange-400',
  INFO: 'text-blue-600 dark:text-blue-400',
  DEBUG: 'text-gray-500 dark:text-gray-400',
}

interface CorrelationSectionProps {
  correlation: NonNullable<AnalysisResult['correlation']>
}

export default function CorrelationSection({ correlation }: CorrelationSectionProps) {
  const { sources, source_breakdown, cascades, timeline } = correlation
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL')

  const sourceColorMap = useMemo(() => {
    const map: Record<string, typeof SOURCE_COLORS[0]> = {}
    sources.forEach((src, i) => {
      map[src] = SOURCE_COLORS[i % SOURCE_COLORS.length]
    })
    return map
  }, [sources])

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'ALL') return timeline
    return timeline.filter(e => e.source === timelineFilter)
  }, [timeline, timelineFilter])

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <GitBranch className="w-6 h-6 text-teal-500" />
        Cross-Service Correlation
        <span className="text-sm font-normal text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2.5 py-0.5 rounded-full ml-2">
          {sources.length} sources
        </span>
      </h2>

      {/* ── Source Breakdown Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src) => {
          const stats = source_breakdown[src]
          const colors = sourceColorMap[src]
          if (!stats) return null

          return (
            <Card key={src} className={`p-6 border ${colors.border} ${colors.bg} shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                <h4 className={`font-bold text-lg ${colors.text} truncate`} title={src}>
                  <Server className="w-4 h-4 inline mr-1.5 opacity-70" />
                  {src}
                </h4>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.errors}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Errors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.warnings}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Warns</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{stats.info}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Info</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Cascade Analysis ──────────────────────────────────────── */}
      {cascades.length > 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Cascading Failures Detected
            <span className="text-sm font-normal text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
              {cascades.length} cascade{cascades.length > 1 ? 's' : ''}
            </span>
          </h3>

          <div className="space-y-6">
            {cascades.map((cascade, i) => {
              const triggerColors = sourceColorMap[cascade.trigger_source] || SOURCE_COLORS[0]

              return (
                <div key={i} className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden bg-red-50/30 dark:bg-red-950/20">
                  {/* Trigger */}
                  <div className="p-5 border-b border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Root Trigger</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${triggerColors.bg} ${triggerColors.text}`}>
                        {cascade.trigger_source}
                      </span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 font-mono text-sm break-words">{cascade.trigger_message}</p>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {cascade.trigger_time}
                    </p>
                  </div>

                  {/* Affected services */}
                  <div className="p-5 space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Triggered {cascade.affected.length} downstream error{cascade.affected.length > 1 ? 's' : ''}
                    </p>
                    {cascade.affected.map((effect, j) => {
                      const effectColors = sourceColorMap[effect.source] || SOURCE_COLORS[1]
                      return (
                        <div key={j} className="flex items-start gap-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg p-3">
                          <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${effectColors.dot}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${effectColors.bg} ${effectColors.text}`}>
                                {effect.source}
                              </span>
                              <span className="text-gray-400 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {effect.time}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm break-words">{effect.message}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── Unified Timeline ──────────────────────────────────────── */}
      {timeline.length > 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" />
              Unified Timeline
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (errors &amp; warnings across all sources)
              </span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={timelineFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setTimelineFilter('ALL')}
                className={`rounded-full text-xs font-semibold ${
                  timelineFilter === 'ALL'
                    ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent'
                    : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Filter className="w-3 h-3 mr-1" /> All
              </Button>
              {sources.map(src => {
                const colors = sourceColorMap[src]
                return (
                  <Button
                    key={src}
                    size="sm"
                    variant={timelineFilter === src ? 'default' : 'outline'}
                    onClick={() => setTimelineFilter(src)}
                    className={`rounded-full text-xs font-semibold ${
                      timelineFilter === src
                        ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent'
                        : `border-gray-300 dark:border-zinc-700 ${colors.text}`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${colors.dot}`} />
                    {src}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Timeline entries */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-zinc-700" />

            <div className="space-y-1">
              {filteredTimeline.slice(0, 100).map((event, i) => {
                const colors = sourceColorMap[event.source] || SOURCE_COLORS[0]
                const isError = event.level === 'ERROR'
                const levelColor = LEVEL_COLORS[event.level] || LEVEL_COLORS.INFO

                return (
                  <div key={i} className="flex items-start gap-4 pl-1 group relative">
                    {/* Dot on timeline */}
                    <div className={`w-[10px] h-[10px] mt-[7px] rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-900 z-10 ${
                      isError ? 'bg-red-500' : 'bg-orange-400'
                    }`} />

                    <div className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      isError
                        ? 'bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800/30'
                    }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-400 dark:text-gray-500 font-mono text-[11px]">{event.time || '\u2014'}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {event.source}
                        </span>
                        <span className={`text-xs font-bold ${levelColor}`}>{event.level}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 break-words">{event.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredTimeline.length > 100 && (
              <p className="text-gray-500 text-xs mt-4 text-center">
                Showing 100 of {filteredTimeline.length} events.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Empty state when no cascades */}
      {cascades.length === 0 && timeline.length === 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-8 shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No cascading failures detected across the uploaded log sources.
          </p>
        </Card>
      )}
    </div>
  )
}
