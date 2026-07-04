export function CoachIllustration() {
  return (
    <svg
      viewBox="0 0 480 360"
      role="img"
      aria-label="Your AI coach"
      className="h-auto w-full max-w-md"
    >
      <defs>
        <linearGradient id="coach-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id="coach-glow" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="240" cy="170" r="150" fill="url(#coach-glow)" />

      {/* orbit rings */}
      <ellipse
        cx="240"
        cy="170"
        rx="140"
        ry="52"
        fill="none"
        stroke="url(#coach-grad)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <circle cx="112" cy="196" r="6" fill="#3b82f6" />
      <circle cx="372" cy="150" r="5" fill="#8b5cf6" />

      {/* coach head */}
      <rect
        x="170"
        y="90"
        width="140"
        height="120"
        rx="36"
        fill="url(#coach-grad)"
      />
      {/* antenna */}
      <line
        x1="240"
        y1="70"
        x2="240"
        y2="90"
        stroke="url(#coach-grad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="240" cy="62" r="8" fill="#8b5cf6" />
      {/* face plate */}
      <rect x="188" y="112" width="104" height="72" rx="24" fill="white" />
      {/* eyes */}
      <circle cx="220" cy="148" r="9" fill="#3b82f6" />
      <circle cx="260" cy="148" r="9" fill="#8b5cf6" />
      {/* smile */}
      <path
        d="M222 166 Q240 178 258 166"
        fill="none"
        stroke="#6366f1"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* body */}
      <rect
        x="196"
        y="216"
        width="88"
        height="64"
        rx="24"
        fill="url(#coach-grad)"
        fillOpacity="0.85"
      />
      <circle cx="240" cy="248" r="12" fill="white" fillOpacity="0.9" />
      <path
        d="M240 241 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7 z"
        fill="#6366f1"
      />

      {/* floating stat chips */}
      <g>
        <rect x="52" y="96" width="112" height="40" rx="20" fill="white" />
        <rect
          x="52"
          y="96"
          width="112"
          height="40"
          rx="20"
          fill="none"
          stroke="#3b82f6"
          strokeOpacity="0.3"
        />
        <text x="108" y="121" textAnchor="middle" fontSize="14" fill="#3b82f6">
          Goal: 82% ↑
        </text>
      </g>
      <g>
        <rect x="316" y="220" width="120" height="40" rx="20" fill="white" />
        <rect
          x="316"
          y="220"
          width="120"
          height="40"
          rx="20"
          fill="none"
          stroke="#8b5cf6"
          strokeOpacity="0.3"
        />
        <text x="376" y="245" textAnchor="middle" fontSize="14" fill="#8b5cf6">
          Streak: 14 🔥
        </text>
      </g>
    </svg>
  );
}
