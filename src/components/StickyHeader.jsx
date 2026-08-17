import React, { useEffect, useState } from 'react';

// Watches the hero section and reveals a compact sticky bar once it's fully
// scrolled past, so the primary CTA is always one tap away — not just at
// the top and bottom of the page.
export default function StickyHeader({ onEnter }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.landing-hero');
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`lp-sticky-cta${visible ? ' show' : ''}`} aria-hidden={!visible}>
      <div className="lp-sticky-cta-inner">
        <div className="lp-brand small">
          <span>JustEdge</span>
        </div>
        <button className="btn btn-amber" onClick={onEnter} tabIndex={visible ? 0 : -1}>
          <svg><use href="#i-zap" /></svg>Get started
        </button>
      </div>
    </div>
  );
}
