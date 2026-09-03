import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useInView } from '../lib/useInView.js';
import BoardsCoverflow from '../components/BoardsCoverflow.jsx';
import NavTabs from '../components/NavTabs.jsx';
import FAQAccordion from '../components/FAQAccordion.jsx';
import Footer from '../components/Footer.jsx';

const FEATURES = [
  {
    icon: 'i-thermo',
    title: 'Live sensor telemetry',
    text: 'Temperature, humidity, battery and signal streamed from every board in real time, with history you can scrub through.',
  },
  {
    icon: 'i-shield',
    title: 'Granular permissions',
    text: 'Give every teammate exactly the sensors and pages they need — nothing more. Roles, invites and access, all in one place.',
  },
  {
    icon: 'i-zap',
    title: 'Automations that watch for you',
    text: 'Set a threshold once and let JustEdge alert, notify or escalate automatically the moment a sensor drifts out of range.',
  },
  {
    icon: 'i-alert',
    title: 'Instant alerting',
    text: 'Offline boards, low battery, temperature excursions — surfaced the second they happen, not buried in a report.',
  },
  {
    icon: 'i-chart',
    title: 'Fleet-wide analytics',
    text: 'Roll every site up into one dashboard. Compare boards, owners and locations at a glance with clean, exportable charts.',
  },
  {
    icon: 'i-cpu',
    title: 'Any board, any site',
    text: 'Cold storage, offices, warehouses, server rooms — JustEdge works with ESP32 and LoRa boards out of the box.',
  },
];

const STEPS = [
  { n: '01', title: 'Connect your boards', text: 'Register a sensor with its board type, IMEI and SIM in under a minute.' },
  { n: '02', title: 'Assign & set rules', text: 'Hand sensors to the right owner and define the automations that matter.' },
  { n: '03', title: 'Watch it run itself', text: 'Live dashboards and alerts keep everyone informed without the busywork.' },
];

// Maps a site type to the board best suited for it, used by the "which
// board fits your site?" picker to jump the coverflow to the right card.
const SITE_PICKS = [
  { label: 'Cold storage', icon: 'i-thermo', boardId: 'nbiot-cs1' },
  { label: 'Office / retail', icon: 'i-wifi', boardId: 'esp32-th1' },
  { label: 'Warehouse', icon: 'i-activity', boardId: 'lora-4ch' },
  { label: 'Industrial line', icon: 'i-link', boardId: 'rs485-gw8' },
];

// Placeholder quotes — swap in real customer names, roles and companies
// once you have them; a fabricated company name would be misleading here.
const TESTIMONIALS = [
  {
    quote: "We caught a compressor failure in Cold Room 2 at 2am from an alert on our phones. That's a full pallet of stock that didn't spoil.",
    name: 'Facilities Lead',
    role: 'Regional cold storage operator',
  },
  {
    quote: 'Rolling out a new site used to mean a spreadsheet and a prayer. Now it\'s register the board, set the thresholds, done.',
    name: 'Ops Manager',
    role: 'Multi-site warehouse group',
  },
  {
    quote: "Our team only sees the sensors they own. No more accidental changes to another site's thresholds.",
    name: 'IT Administrator',
    role: 'Corporate office network',
  },
];

// Rotates through a few example alerts inside the hero mockup so the panel
// demonstrates real-time alerting rather than just sitting there looking calm.
const LIVE_EVENTS = [
  { icon: 'i-check', text: 'Cold Room 2 — back in range (2.1°C)' },
  { icon: 'i-alert', text: 'SN-014 — battery at 18%, replace soon' },
  { icon: 'i-wifi', text: 'Warehouse B — all 12 boards online' },
  { icon: 'i-zap', text: 'Automation fired — escalated to on-call' },
];

function useCountUp(target, active, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

function Stat({ label, value, suffix = '', active }) {
  const n = useCountUp(value, active);
  return (
    <div className="lp-stat">
      <div className="lp-stat-value num">{n}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function LiveTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(v => (v + 1) % LIVE_EVENTS.length), 3400);
    return () => clearInterval(id);
  }, []);
  const event = LIVE_EVENTS[i];
  return (
    <div className="lp-live-ticker">
      <span className="pulse-dot" />
      <span key={i} className="lp-live-ticker-text">
        <svg><use href={`#${event.icon}`} /></svg>{event.text}
      </span>
    </div>
  );
}

export default function LandingPage({ onEnter, onDemo }) {
  const { sensors, users } = useData();
  const [statsActive, setStatsActive] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const boardsRef = useRef(null);
  const [proofRef, proofActive] = useInView({ threshold: 0.4 });

  useEffect(() => {
    const t = setTimeout(() => setStatsActive(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  const onlineCount = useMemo(() => sensors.filter(s => s.status === 'online').length, [sensors]);
  const uptimePct = sensors.length ? Math.round((onlineCount / sensors.length) * 1000) / 10 : 99.9;

  function goTo(e, id) {
    e.preventDefault();
    setMobileNavOpen(false);
    scrollToSection(id);
  }

  function scrollToSection(id) {
    setMobileNavOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function pickBoard(boardId) {
    const el = document.getElementById('boards');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    boardsRef.current?.selectBoard(boardId);
  }

  return (
    <div className="landing">
      <div className="landing-glow landing-glow-1" />
      <div className="landing-glow landing-glow-2" />

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="lp-brand">
            <span>JustEdge</span>
          </div>
          <nav className="lp-nav-links">
            <NavTabs onNavigate={scrollToSection} />
          </nav>
          <button className="btn btn-ghost lp-nav-cta" onClick={onEnter}>
            <svg><use href="#i-check" /></svg>Sign in
          </button>
          <button
            className={`lp-mobile-menu-btn${mobileNavOpen ? ' open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setMobileNavOpen(v => !v)}
          >
            <svg><use href={mobileNavOpen ? '#i-x' : '#i-menu'} /></svg>
          </button>
        </div>
        <div className={`lp-mobile-menu${mobileNavOpen ? ' open' : ''}`}>
          <a href="#boards" onClick={(e) => goTo(e, 'boards')}><svg><use href="#i-cpu" /></svg>Hardware</a>
          <a href="#features" onClick={(e) => goTo(e, 'features')}><svg><use href="#i-chart" /></svg>Features</a>
          <a href="#how" onClick={(e) => goTo(e, 'how')}><svg><use href="#i-zap" /></svg>How it works</a>
          <a href="#faqs" onClick={(e) => goTo(e, 'faqs')}><svg><use href="#i-quote" /></svg>FAQs</a>
          <a href="#plans" onClick={(e) => goTo(e, 'plans')}><svg><use href="#i-receipt" /></svg>Plans</a>
          <button className="btn btn-amber btn-block" onClick={() => { setMobileNavOpen(false); onEnter(); }}>
            <svg><use href="#i-check" /></svg>Sign in
          </button>
        </div>
      </header>
      {mobileNavOpen && <div className="lp-mobile-overlay" onClick={() => setMobileNavOpen(false)} />}

      <section className="landing-hero" id="top">
        <div className="lp-eyebrow"><span className="pulse-dot" />Live fleet monitoring, reimagined</div>
        <h1 className="lp-hero-title">
          JustEdge<br />
          Catch the problem<br />
          <span className="lp-hero-accent">before it costs you.</span>
        </h1>
        <p className="lp-hero-sub">
          JustEdge watches temperature, humidity, battery and signal across your entire fleet —
          cold storage, offices, warehouses — and tells you the moment something needs attention,
          not after the damage is done.
        </p>
        <div className="lp-hero-byline">JustEdge is sold by <b>JustEmbedded</b>, engineered and manufactured by <b>Susima Smaart Solutions</b>.</div>
<div className="lp-hero-actions">
  <button className="btn btn-amber lp-btn-lg" type="button" onClick={onEnter}>
    <svg><use href="#i-zap" /></svg>Get started
  </button>
  <button
    className="btn btn-ghost lp-btn-lg"
    type="button"
    onClick={(e) => {
      e.preventDefault();
      if (typeof onDemo === 'function') onDemo();
      else window.location.assign('/demo/admin');
    }}
  >
    View live demo<svg><use href="#i-chev" /></svg>
  </button>
</div>

        <div className="lp-stats-row">
          <Stat label="Sensors tracked" value={sensors.length || 20} active={statsActive} />
          <Stat label="Team members" value={users.length || 10} active={statsActive} />
          <Stat label="Fleet uptime" value={uptimePct} suffix="%" active={statsActive} />
          <Stat label="Alert response" value={12} suffix="s" active={statsActive} />
        </div>

        <div className="lp-hero-panel">
          <div className="lp-panel-head">
            <div className="lp-panel-dots"><span /><span /><span /></div>
            <div className="lp-panel-title">Fleet overview</div>
            <span className="role-chip"><svg><use href="#i-wifi" /></svg>{onlineCount}/{sensors.length || 20} online</span>
          </div>
          <div className="lp-panel-grid">
            {(sensors.length ? sensors : []).slice(0, 6).map((s, i) => (
              <div className="lp-panel-card lp-panel-card-in" style={{ animationDelay: `${i * 70}ms` }} key={s.id}>
                <div className="lp-panel-card-top">
                  <span className={`login-ticker-dot${s.status === 'online' ? ' on' : ''}`} />
                  <span className="lp-panel-card-name">{s.name}</span>
                </div>
                <div className="lp-panel-card-metrics">
                  <span className="num">{s.temp}°C</span>
                  <span className="num">{s.battery}%</span>
                </div>
              </div>
            ))}
          </div>
          <LiveTicker />
        </div>
      </section>

      <section className="landing-section lp-boards-section" id="boards">
        <div className="lp-section-head">
          <div className="lp-eyebrow lp-eyebrow-dark">Hardware</div>
          <h2>One dashboard, any board</h2>
          <p>JustEdge ships as ready-to-flash hardware from JustEmbedded — pick the connectivity that fits the site.</p>
        </div>

        <div className="lp-board-picker">
          <span className="lp-board-picker-label">Which board fits your site?</span>
          <div className="lp-board-picker-chips">
            {SITE_PICKS.map(p => (
              <button type="button" key={p.boardId} className="lp-board-picker-chip" onClick={() => pickBoard(p.boardId)}>
                <svg><use href={`#${p.icon}`} /></svg>{p.label}
              </button>
            ))}
          </div>
        </div>

        <BoardsCoverflow ref={boardsRef} />
      </section>

      <section className="lp-logos" ref={proofRef}>
        <div className="lp-logos-label">Trusted for cold storage, offices &amp; warehouses across every region</div>
        <div className="lp-proof-stats">
          <Stat label="Sites live" value={sensors.length ? Math.max(8, Math.ceil(sensors.length / 2)) : 24} suffix="+" active={proofActive} />
          <Stat label="Readings a day" value={sensors.length ? sensors.length * 288 : 6200} active={proofActive} />
          <Stat label="Avg. alert time" value={12} suffix="s" active={proofActive} />
          <Stat label="Fleet uptime" value={uptimePct} suffix="%" active={proofActive} />
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="lp-section-head">
          <div className="lp-eyebrow lp-eyebrow-dark">Why JustEdge</div>
          <h2>Built for teams who can't afford to miss a reading</h2>
          <p>Everything you need to keep a distributed sensor fleet healthy, in one clean interface.</p>
        </div>
        <div className="lp-feature-grid">
          {FEATURES.map(f => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon"><svg><use href={`#${f.icon}`} /></svg></div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-text">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="how">
        <div className="lp-section-head">
          <div className="lp-eyebrow lp-eyebrow-dark">How it works</div>
          <h2>From unboxing to live dashboard in minutes</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="lp-step">
                <div className="lp-step-n">{s.n}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-text">{s.text}</div>
              </div>
              {i < STEPS.length - 1 && <div className="lp-step-line" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="landing-section" id="testimonials">
        <div className="lp-section-head">
          <div className="lp-eyebrow lp-eyebrow-dark">From the field</div>
          <h2>What running on JustEdge looks like</h2>
        </div>
        <div className="lp-testimonial-grid">
          {TESTIMONIALS.map(t => (
            <div className="lp-testimonial-card" key={t.name}>
              <svg className="lp-testimonial-quote-mark"><use href="#i-quote" /></svg>
              <p className="lp-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="lp-testimonial-name">{t.name}</div>
              <div className="lp-testimonial-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="faqs">
        <div className="lp-faqs-grid">
          <div className="lp-faqs-head">
            <div className="lp-eyebrow lp-eyebrow-dark">FAQs</div>
            <h2>Everything you need to know</h2>
            <p className="lp-faqs-lead">Answers to what people usually ask before switching on JustEdge.</p>
            <p className="lp-faqs-contact">Can&rsquo;t find what you&rsquo;re looking for? Reach out through your dashboard once you&rsquo;re signed in.</p>
          </div>
          <FAQAccordion />
        </div>
      </section>

      <section className="landing-cta" id="plans">
        <div className="lp-cta-card">
          <div className="lp-cta-copy">
            <h2>Ready to see your fleet like never before?</h2>
            <p>Jump into the live demo — admin and user views, real sensor data, zero setup.</p>
          </div>
          <button className="btn btn-amber lp-btn-lg" onClick={onEnter}>
            <svg><use href="#i-check" /></svg>Enter dashboard
          </button>
        </div>
      </section>

      <Footer onNavigate={scrollToSection} />
    </div>
  );
}