import React from "react";
<<<<<<< HEAD
import { cn } from "../lib/utils";
=======
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04

export default function LogoIcon({ size = 40, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
<<<<<<< HEAD
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("text-primary", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
=======
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="logoIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8291c" />
          <stop offset="100%" stopColor="#ff4d3d" />
        </linearGradient>
        <filter id="logoIconGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Bag body */}
      <rect
        x="5"
        y="18"
        width="50"
        height="42"
        rx="10"
        fill="url(#logoIconGrad)"
        filter="url(#logoIconGlow)"
      />

      {/* Bag handles */}
      <path
        d="M18 18 V12 C18 5 25 2 30 2 C35 2 42 5 42 12 V18"
        stroke="url(#logoIconGrad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Lightning bolt */}
      <path
        d="M32 28 L24 45 L30 45 L28 55 L40 40 L34 40 L38 28 Z"
        fill="white"
        opacity="0.95"
      />
>>>>>>> 7a936b07f48b43d7f5672176b09371ae9ab85c04
    </svg>
  );
}
