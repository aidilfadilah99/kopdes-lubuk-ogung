"use client";

import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Ikon Kwitansi / Struk Resmi bertuliskan "Rp" (Bukan simbol dollar $)
 */
export function RpReceipt({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer receipt with zigzag edges */}
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      {/* "Rp" label in the center */}
      <text
        x="12"
        y="14.5"
        fontSize="8"
        fontWeight="900"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5px"
      >
        Rp
      </text>
    </svg>
  );
}

/**
 * Ikon Uang Kertas Rupiah bertuliskan "Rp"
 */
export function RpBanknote({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <circle cx="12" cy="12" r="3.5" strokeWidth="1.5" />
      <text
        x="12"
        y="14.2"
        fontSize="6.5"
        fontWeight="900"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Rp
      </text>
    </svg>
  );
}

/**
 * Ikon Badge Keuangan Rupiah bertuliskan "Rp"
 */
export function RpBadge({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <text
        x="12"
        y="14.8"
        fontSize="7.5"
        fontWeight="900"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Rp
      </text>
    </svg>
  );
}

/**
 * Ikon Koin Rupiah Bulat
 */
export function RpCoin({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <text
        x="12"
        y="15"
        fontSize="8"
        fontWeight="900"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Rp
      </text>
    </svg>
  );
}
