export function LogSenseLogo({ className = "w-8 h-8", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className} 
      style={style}
      aria-label="LogSense Logo"
    >
      <rect width="100" height="100" rx="16" fill="#0a0a0a" />
      <g stroke="#39ff14" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* Left star */}
        <polygon points="17,22 20,32 30,32 22,38 25,48 17,42 9,48 12,38 4,32 14,32" strokeWidth="2.5" />
        {/* Center star */}
        <polygon points="50,12 55,26 69,26 58,34 62,48 50,39 38,48 42,34 31,26 45,26" strokeWidth="3" />
        {/* Right star */}
        <polygon points="83,22 86,32 96,32 88,38 91,48 83,42 75,48 78,38 70,32 80,32" strokeWidth="2.5" />
      </g>
      <text 
        x="50" y="80" 
        fontFamily="Impact, Arial Black, sans-serif" 
        fontSize="22" 
        fontWeight="bold" 
        fill="#ffffff" 
        textAnchor="middle"
        letterSpacing="0.5"
      >
        LogSense
      </text>
    </svg>
  )
}
