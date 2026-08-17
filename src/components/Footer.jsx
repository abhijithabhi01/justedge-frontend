import React from 'react';

// Multi-column landing footer: brand blurb + social line on the left,
// grouped quick-links on the right. Section links reuse the same
// scrollToSection handler as the header nav so they smooth-scroll instead
// of hard-navigating. Ported from a shadcn/Tailwind reference component to
// this project's vanilla CSS + inline SVG-sprite icons.
const COLUMNS = [
  {
    title: 'Product',
    links: [
      { name: 'Hardware', icon: 'i-cpu', sectionId: 'boards' },
      { name: 'Features', icon: 'i-chart', sectionId: 'features' },
      { name: 'How it works', icon: 'i-zap', sectionId: 'how' },
      { name: 'Plans', icon: 'i-receipt', sectionId: 'plans' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'FAQs', icon: 'i-quote', sectionId: 'faqs' },
      { name: 'Customer stories', icon: 'i-users', sectionId: 'testimonials' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', icon: 'i-shield', href: '#' },
      { name: 'Terms of Service', icon: 'i-lock', href: '#' },
    ],
  },
];

const SOCIAL_LINKS = [
  { name: 'Twitter', href: '#' },
  { name: 'GitHub', href: '#' },
  { name: 'LinkedIn', href: '#' },
];

export default function Footer({ onNavigate }) {
  function handleLinkClick(e, sectionId) {
    if (!sectionId || !onNavigate) return;
    e.preventDefault();
    onNavigate(sectionId);
  }

  return (
    <footer className="landing-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div className="lp-brand"><span>JustEdge</span></div>
          <p className="lp-footer-desc">
            Live sensor monitoring for cold storage, offices and warehouses
          </p>
          <p className="lp-footer-social">
            {SOCIAL_LINKS.map((link, index) => (
              <React.Fragment key={link.name}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.name}
                </a>
                {index < SOCIAL_LINKS.length - 1 && ' • '}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="lp-footer-columns">
          {COLUMNS.map((column) => (
            <div className="lp-footer-col" key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map(({ name, icon, href, sectionId }) => (
                  <li key={name}>
                    <a href={href || `#${sectionId}`} onClick={(e) => handleLinkClick(e, sectionId)}>
                      <svg><use href={`#${icon}`} /></svg>
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-footer-bottom">
        <p>
          © {new Date().getFullYear()} JustEdge. IoT sensor monitoring, done right.
          <br />Sold by JustEmbedded — engineered and manufactured by Susima Smaart Solutions.
        </p>
      </div>
    </footer>
  );
}