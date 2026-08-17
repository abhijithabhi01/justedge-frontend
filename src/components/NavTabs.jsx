import React, { useEffect, useRef, useState } from 'react';

const TABS = [
  { label: 'Home', id: 'top' },
  { label: 'Hardware', id: 'boards' },
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how' },
  { label: 'FAQs', id: 'faqs' },
  { label: 'Plans', id: 'plans' },
];

export default function NavTabs({ onNavigate }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [cursor, setCursor] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef([]);
  const listRef = useRef(null);

  const activeIndex = hovered ?? selected;

  const measure = (i) => {
    const el = tabRefs.current[i];
    const list = listRef.current;
    if (!el || !list) return;
    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    setCursor({ left: elRect.left - listRect.left, width: elRect.width, opacity: 1 });
  };

  useEffect(() => { measure(activeIndex); }, [activeIndex]);

  useEffect(() => {
    const onResize = () => measure(activeIndex);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Highlights whichever section is currently in view, so the pill tracks
  // scroll position too — not just clicks — same way the reference tracks
  // whichever tab is hovered/selected.
  useEffect(() => {
    const sections = TABS.map(t => document.getElementById(t.id)).filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = TABS.findIndex(t => t.id === entry.target.id);
          if (idx !== -1) setSelected(idx);
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function handleClick(i, id) {
    setSelected(i);
    onNavigate(id);
  }

  return (
    <ul
      className="nav-tabs"
      ref={listRef}
      onMouseLeave={() => setHovered(null)}
    >
      <li className="nav-tabs-cursor" style={{ left: cursor.left, width: cursor.width, opacity: cursor.opacity }} aria-hidden="true" />
      {TABS.map((tab, i) => (
        <li
          key={tab.id}
          ref={(el) => { tabRefs.current[i] = el; }}
          className={`nav-tabs-item${i === activeIndex ? ' active' : ''}`}
          onMouseEnter={() => setHovered(i)}
          onClick={() => handleClick(i, tab.id)}
        >
          {tab.label}
        </li>
      ))}
    </ul>
  );
}
