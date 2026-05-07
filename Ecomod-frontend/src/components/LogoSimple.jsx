// src/components/LogoSimple.jsx
export default function LogoSimple() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 100"
      style={{ width: "100%", height: "auto", maxWidth: "180px" }}
    >
      <defs>
        <linearGradient
          id="primaryGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Icon: Shopping bag with lightning bolt */}
      <g transform="translate(10, 10)">
        {/* Bag body */}
        <rect
          x="5"
          y="25"
          width="50"
          height="55"
          rx="8"
          fill="url(#primaryGradient)"
          filter="url(#glow)"
        />

        {/* Bag handles */}
        <path
          d="M18 25 V18 C18 10 25 5 30 5 C35 5 42 10 42 18 V25"
          stroke="url(#primaryGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Lightning bolt */}
        <path
          d="M32 35 L24 52 L30 52 L28 65 L40 48 L34 48 L38 35 Z"
          fill="white"
          opacity="0.95"
        />
      </g>

      {/* Text: Eco */}
      <text
        x="75"
        y="62"
        fontFamily="'Segoe UI', 'Arial', sans-serif"
        fontSize="42"
        fontWeight="300"
        fill="#374151"
      >
        Eco
      </text>

      {/* Text: Mod */}
      <text
        x="143"
        y="62"
        fontFamily="'Segoe UI', 'Arial', sans-serif"
        fontSize="42"
        fontWeight="700"
        fill="url(#accentGradient)"
      >
        Mod
      </text>

      {/* Subtitle */}
      <text
        x="75"
        y="82"
        fontFamily="'Segoe UI', 'Arial', sans-serif"
        fontSize="11"
        fontWeight="500"
        fill="#9ca3af"
        letterSpacing="3"
      >
        COMMERCE PLATFORM
      </text>

      {/* Decorative dots */}
      <circle cx="75" cy="92" r="1.5" fill="#f43f5e" opacity="0.6" />
      <circle cx="82" cy="92" r="1.5" fill="#f97316" opacity="0.6" />
      <circle cx="89" cy="92" r="1.5" fill="#fb923c" opacity="0.6" />
      <circle cx="96" cy="92" r="1.5" fill="#f97316" opacity="0.6" />
      <circle cx="103" cy="92" r="1.5" fill="#f43f5e" opacity="0.6" />
    </svg>
  );
}
