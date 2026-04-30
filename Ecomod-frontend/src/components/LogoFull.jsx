import React from "react";

export default function LogoFull({ width = 200, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 80"
      width={width}
      height="auto"
      className={className}
      style={{ height: "auto" }}
    >
      <defs>
        <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8291c" />
          <stop offset="100%" stopColor="#ff4d3d" />
        </linearGradient>
        <linearGradient id="logoFullAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8291c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ff4d3d" />
        </linearGradient>
        <filter id="logoFullGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Icon: Shopping bag with lightning bolt */}
      <g transform="translate(8, 8)">
        {/* Bag body */}
        <rect
          x="5"
          y="18"
          width="44"
          height="38"
          rx="8"
          fill="url(#logoFullGrad)"
          filter="url(#logoFullGlow)"
        />

        {/* Bag handles */}
        <path
          d="M16 18 V13 C16 7 22 4 27 4 C32 4 38 7 38 13 V18"
          stroke="url(#logoFullGrad)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Lightning bolt */}
        <path
          d="M28 26 L22 40 L27 40 L25 48 L35 36 L30 36 L33 26 Z"
          fill="white"
          opacity="0.95"
        />
      </g>

      {/* Text: Eco */}
      <text
        x="68"
        y="50"
        fontFamily="'Barlow Condensed', 'Inter', sans-serif"
        fontSize="38"
        fontWeight="600"
        fill="#1a1a1a"
        letterSpacing="-1"
      >
        Eco
      </text>

      {/* Text: Mod */}
      <text
        x="130"
        y="50"
        fontFamily="'Barlow Condensed', 'Inter', sans-serif"
        fontSize="38"
        fontWeight="800"
        fill="url(#logoFullAccent)"
        letterSpacing="-1"
      >
        Mod
      </text>

      {/* Subtitle */}
      <text
        x="68"
        y="68"
        fontFamily="'Inter', sans-serif"
        fontSize="9"
        fontWeight="600"
        fill="#9ca3af"
        letterSpacing="3"
      >
        COMMERCE PLATFORM
      </text>
    </svg>
  );
}
