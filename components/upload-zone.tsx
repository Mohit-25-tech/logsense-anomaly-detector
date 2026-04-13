import { Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

interface UploadZoneProps {
  onFilesDrop: (files: File[]) => void
  onBrowse: () => void
}

export default function UploadZone({ onFilesDrop, onBrowse }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files)
      onFilesDrop(filesArr)
    }
  }

  return (
    <Card
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed transition-all duration-300 cursor-pointer p-12 text-center relative overflow-hidden bg-white dark:bg-zinc-900/50 ${
        isDragActive
          ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 shadow-[0_0_30px_rgba(20,184,166,0.3)] dark:shadow-[0_0_30px_rgba(20,184,166,0.4)] animate-pulse'
          : 'border-gray-200 dark:border-zinc-700 hover:border-teal-500/50 dark:hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] dark:hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]'
      }`}
    >
      <Cloud 
        className={`w-16 h-16 mx-auto mb-4 stroke-1 fill-none transition-colors ${isDragActive ? 'text-teal-500' : 'text-gray-400 dark:text-teal-400/60'}`} 
        strokeWidth={1.5}
      />
      <p className="text-gray-800 dark:text-white text-lg mb-1 font-semibold">Drop your log files here</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Multiple files supported for cross-service correlation</p>
      <p className="text-gray-500 dark:text-gray-400 mb-6">or</p>
      <input
        type="file"
        id="file-input"
        accept=".log,.txt"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesDrop(Array.from(e.target.files))
          }
        }}
        className="hidden"
      />
      <label htmlFor="file-input">
        <Button
          onClick={onBrowse}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8 py-2 font-semibold cursor-pointer"
          asChild
        >
          <span>Browse Files</span>
        </Button>
      </label>
      <p className="text-gray-500 text-xs mt-6">Supported formats: .log .txt</p>
    </Card>
  )
}
