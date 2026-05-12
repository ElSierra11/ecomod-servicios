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
      <rect width="64" height="64" rx="14" fill="url(#logo-grad)" />
      {/* Shopping bag body */}
      <rect x="16" y="26" width="32" height="28" rx="5" fill="white" opacity="0.95" />
      {/* Bag handle */}
      <path
        d="M24 26 V20 C24 14 27.5 10 32 10 C36.5 10 40 14 40 20 V26"
        stroke="white"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Stylized E */}
      <path
        d="M26 34 L38 34 M26 38 L34 38 M26 42 L38 42 M26 46 L34 46"
        stroke="#dc2626"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64">
          <stop stopColor="#dc2626" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}
