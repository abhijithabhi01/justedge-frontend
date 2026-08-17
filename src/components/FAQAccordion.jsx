import React, { useEffect, useMemo, useState } from 'react';

const FAQ_ITEMS = [
  {
    id: 'item-1',
    q: 'What is JustEdge?',
    a: 'JustEdge is the dashboard that watches your sensor fleet — live temperature, humidity, battery and signal, plus alerts and automations, for cold storage, offices and warehouses.',
  },
  {
    id: 'item-2',
    q: 'Do I need to buy hardware separately?',
    a: 'Yes. Boards are sold by JustEmbedded and manufactured by Susima Smaart Solutions. JustEdge is the software side — once a board is registered, it shows up live on your dashboard.',
  },
  {
    id: 'item-3',
    q: 'Which boards does JustEdge support?',
    a: 'ESP32 Wi-Fi, LoRaWAN, NB-IoT cellular and Modbus RS-485 gateway boards all work out of the box. Use the board picker above to find the right one for your site.',
  },
  {
    id: 'item-4',
    q: 'Can I control who sees what?',
    a: 'Yes — granular per-teammate permissions let you scope each person to exactly the sensors and pages they need, and nothing more.',
  },
  {
    id: 'item-5',
    q: 'What happens when a sensor goes out of range?',
    a: 'Automations you set up alert, notify or escalate the moment a threshold is crossed, so nothing waits for a scheduled report.',
  },
];

// Splits into words rather than individual characters like the reference —
// far fewer DOM nodes for longer answers, while keeping the same staggered
// blur-in reveal. Re-mounts (and so re-plays) every time the item opens,
// since this only renders while `open` is true.
function BlurredStagger({ text }) {
  const words = useMemo(() => text.split(' '), [text]);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <p className="faq-reveal-text">
      {words.map((word, i) => (
        <span
          key={i}
          className={`faq-reveal-word${shown ? ' show' : ''}`}
          style={{ transitionDelay: `${i * 26}ms` }}
        >
          {word}&nbsp;
        </span>
      ))}
    </p>
  );
}

export default function FAQAccordion() {
  const [openId, setOpenId] = useState(FAQ_ITEMS[0].id);

  return (
    <div className="faq-accordion">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div className={`faq-item${isOpen ? ' open' : ''}`} key={item.id}>
            <button
              type="button"
              className="faq-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              {item.q}
              <svg className="faq-chevron"><use href="#i-chev" /></svg>
            </button>
            <div className="faq-panel" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
              <div className="faq-panel-inner">
                {isOpen && <BlurredStagger text={item.a} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
