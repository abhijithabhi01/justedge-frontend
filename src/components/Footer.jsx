import React from 'react';

export default function Footer({ onNavigate }) {
  function handleLinkClick(e, sectionId) {
    if (!sectionId || !onNavigate) return;
    e.preventDefault();
    onNavigate(sectionId);
  }

  return (
    <footer className="landing-footer" id="footer">
      <div className="lp-footer-inner lp-footer-ref">
        {/* Brand column */}
        <div className="lp-footer-brand">
          <div className="lp-brand">
            <span>JustEdge</span>
          </div>
          <p className="lp-footer-desc">
            Live sensor monitoring for cold storage, offices and warehouses.
            Cloud dashboards powered by Susima Cloud.
          </p>
          <div className="lp-footer-social-icons">
            <a
              href="https://www.linkedin.com/company/susima-smaart-solutions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Susima on LinkedIn"
              title="Susima LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
              </svg>
            </a>
            <a
              href="https://susimatech.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Susima website"
              title="susimatech.com"
            >
              <img src="/brand/susima-logo.png" alt="" className="lp-footer-mini-logo" />
            </a>
            <a
              href="https://justembedded.in"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="JustEmbedded website"
              title="justembedded.in"
            >
              <img src="/brand/justembedded-logo.png" alt="" className="lp-footer-mini-logo je" />
            </a>
          </div>
        </div>

        {/* Link columns — single row with brand */}
        <div className="lp-footer-columns">
          <div className="lp-footer-col">
            <h3>Product</h3>
            <ul>
              <li>
                <a href="#boards" onClick={(e) => handleLinkClick(e, 'boards')}>
                  Hardware
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleLinkClick(e, 'features')}>
                  Features
                </a>
              </li>
              <li>
                <a href="#how" onClick={(e) => handleLinkClick(e, 'how')}>
                  How it works
                </a>
              </li>
              <li>
                <a href="#faqs" onClick={(e) => handleLinkClick(e, 'faqs')}>
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h3>Design &amp; Development</h3>
            <ul>
              <li className="lp-footer-org">
                <img src="/brand/susima-logo.png" alt="" className="lp-footer-col-logo" />
                <span>Susima Smaart Solutions</span>
              </li>
              <li>
                <a href="https://susimatech.com" target="_blank" rel="noopener noreferrer">
                  susimatech.com
                </a>
              </li>
              <li>
                <a href="mailto:sales@susimatech.com">sales@susimatech.com</a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/susima-smaart-solutions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h3>Buy from</h3>
            <ul>
              <li className="lp-footer-org">
                <img src="/brand/justembedded-logo.png" alt="" className="lp-footer-col-logo je" />
                <span>JustEmbedded</span>
              </li>
              <li>
                <a href="https://justembedded.in" target="_blank" rel="noopener noreferrer">
                  justembedded.in
                </a>
              </li>
              <li>
                <a href="mailto:sales@susimatech.com">sales@susimatech.com</a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/justembedded"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom lp-footer-bottom-ref">
        <p>
          © {new Date().getFullYear()} JustEdge. All rights reserved.
        </p>
        <div className="lp-footer-bottom-links">
          <a href="#">Terms and Conditions</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
