import React from 'react';

/**
 * Centered page loader for JustEdge (custom CSS — not Tailwind/shadcn).
 * Use <PageLoader /> for full content-area overlay, or <Spinner /> inline.
 */
export function Spinner({ className = '', size = 36, label = 'Loading' }) {
  return (
    <div
      className={`je-spinner${className ? ` ${className}` : ''}`}
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeOpacity="0.2"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Full-area centered loader (use inside .content or as page overlay). */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-busy="true">
      <Spinner size={40} label={label} />
      <span className="page-loader-label">{label}</span>
    </div>
  );
}

export default Spinner;