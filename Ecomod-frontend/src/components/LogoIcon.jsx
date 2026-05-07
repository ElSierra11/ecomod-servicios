import React from "react";

export default function LogoIcon({ size = 32, className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="16" fill="url(#logo-grad)" />
      <path
        d="M18 22h28M18 32h20M18 42h24"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="48" cy="42" r="6" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#e8291c" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}
