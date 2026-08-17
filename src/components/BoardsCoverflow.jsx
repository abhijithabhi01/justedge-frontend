import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useData } from '../context/DataContext.jsx';

const CONN_ICON = {
  'Wi-Fi': 'i-wifi',
  LoRaWAN: 'i-activity',
  'NB-IoT (Cellular)': 'i-sim',
  'Modbus RS-485': 'i-link',
};

const AUTOPLAY_MS = 3200;

// Accepts an optional `boards` prop so this component can be reused outside
// this app (or with a different dataset) without needing DataContext at all —
// falls back to the live boardCatalog when no prop is passed, so every
// existing call site keeps working unchanged.
const BoardsCoverflow = forwardRef(function BoardsCoverflow({ boards: boardsProp, autoplay = true }, ref) {
  const { boardCatalog } = useData();
  const boards = boardsProp || boardCatalog || [];
  const count = boards.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pulseId, setPulseId] = useState(null);
  const frameRef = useRef(null);

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Lets a parent (e.g. a "which board fits your site?" picker) jump the
  // carousel to a specific board by id without lifting all of its state up.
  useImperativeHandle(ref, () => ({
    selectBoard(id) {
      const i = boards.findIndex(b => b.id === id);
      if (i === -1) return;
      setPaused(true);
      goTo(i);
      setPulseId(id);
      window.clearTimeout(BoardsCoverflow._pulseTimer);
      BoardsCoverflow._pulseTimer = window.setTimeout(() => setPulseId(null), 900);
    },
  }), [boards, goTo]);

  // Automatic carousel — advances on an interval, pauses on hover/focus/drag
  // so a visitor reading a card isn't fighting the timer.
  useEffect(() => {
    if (!autoplay || paused || count < 2) return undefined;
    const id = setInterval(() => setIndex(i => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplay, paused, count]);

  const cards = useMemo(() => {
    return boards.map((board, i) => {
      // Fold the offset into the shorter way round the ring so the layout loops
      // rather than unwinding across the full board list every step.
      let offset = i - index;
      offset = ((offset % count) + count) % count;
      if (offset > count / 2) offset -= count;

      const distance = Math.abs(offset);
      const sign = Math.sign(offset);
      const ramp = Math.min(distance, 3);
      const tilt = Math.min(38 * ramp, 60) * sign;
      const translateX = offset * 62; // percent of card width
      const translateZ = -70 * ramp;
      const scale = 1 - 0.1 * ramp;
      const opacity = distance > 3 ? 0 : Math.max(0, 1 - 0.32 * distance);
      const zIndex = 100 - Math.round(distance);

      return { board, i, offset, distance, style: { transform: `translateX(-50%) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${-tilt}deg) scale(${scale})`, opacity, zIndex } };
    });
  }, [boards, count, index]);

  if (!count) return null;

  const active = boards[index];

  return (
    <div
      className="boards-cf"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="boards-cf-frame"
        ref={frameRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Supported boards"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); setPaused(true); prev(); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setPaused(true); next(); }
        }}
      >
        <div className="boards-cf-track">
          {cards.map(({ board, i, style }) => (
            <div
              key={board.id}
              className={`board-cf-card${i === index ? ' active' : ''}${board.id === pulseId ? ' pulse' : ''}`}
              style={style}
              onClick={() => { setPaused(true); goTo(i); }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${board.name}, ${i + 1} of ${count}`}
            >
              <div className="board-cf-card-icon"><svg><use href={`#${CONN_ICON[board.conn] || 'i-cpu'}`} /></svg></div>
              <div className="board-cf-card-name">{board.name}</div>
              <div className="board-cf-card-conn">{board.conn}</div>
              <div className="board-cf-card-probes">{board.probes} probe{board.probes === 1 ? '' : 's'}</div>
            </div>
          ))}
        </div>

        <button type="button" className="board-cf-nav prev" aria-label="Previous board" onClick={() => { setPaused(true); prev(); }}>
          <svg style={{ transform: 'rotate(180deg)' }}><use href="#i-chev" /></svg>
        </button>
        <button type="button" className="board-cf-nav next" aria-label="Next board" onClick={() => { setPaused(true); next(); }}>
          <svg><use href="#i-chev" /></svg>
        </button>
      </div>

      <div className="board-cf-caption" key={index}>
        <div className="board-cf-caption-title">{active.name}</div>
        <div className="board-cf-caption-text">{active.desc}</div>
      </div>

      <div className="board-cf-dots">
        {boards.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Go to ${b.name}`}
            aria-current={i === index}
            className={`board-cf-dot${i === index ? ' active' : ''}`}
            onClick={() => { setPaused(true); goTo(i); }}
          />
        ))}
      </div>
    </div>
  );
});

export default BoardsCoverflow;
