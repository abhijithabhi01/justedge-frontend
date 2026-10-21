import React from 'react';

/**
 * Compact JustEdge logo for sidebar, header, footer, login.
 * size: 'sm' | 'md' | 'lg'
 */
export default function BrandLogo({ size = 'sm', showText = false, className = '' }) {
  const heights = { sm: 28, md: 36, lg: 48 };
  const h = heights[size] || heights.sm;

  return (
    <span
      className={`brand-logo${className ? ` ${className}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        lineHeight: 1,
      }}
    >
      <img
        src="/brand/justedge-logo.png"
        alt="JustEdge"
        height={h}
        style={{
          height: h,
          width: 'auto',
          maxWidth: size === 'sm' ? 120 : size === 'md' ? 160 : 200,
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {showText ? (
        <span className="brand-name" style={{ fontWeight: 700 }}>
          JustEdge
        </span>
      ) : null}
    </span>
  );
}