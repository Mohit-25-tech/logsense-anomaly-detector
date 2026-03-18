import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { LogSenseLogo } from '@/components/logo'

export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <LogSenseLogo className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white pt-1">
            Log<span className="text-teal-600 dark:text-teal-400">Sense</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/report" 
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Report
          </Link>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
