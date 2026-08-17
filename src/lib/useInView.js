import { useEffect, useRef, useState } from 'react';

/**
 * Fires `active` true the first time the element scrolls into view, then
 * disconnects — for one-shot reveal/count-up animations. Falls back to
 * "already visible" if IntersectionObserver isn't available.
 */
export function useInView(options = { threshold: 0.35 }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, active];
}
