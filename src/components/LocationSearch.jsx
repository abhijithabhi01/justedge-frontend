import React, { useEffect, useRef, useState } from 'react';

/**
 * Place search with suggestions (OpenStreetMap Nominatim).
 * onSelect({ label, lat, lng, site })
 */
export default function LocationSearch({
  value = '',
  onSelect,
  placeholder = 'Search location…',
}) {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function search(q) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (!q || q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?' +
          new URLSearchParams({
            format: 'json',
            q: q.trim(),
            addressdetails: '1',
            limit: '6',
          });
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            // Nominatim usage policy: identify your app
            'Accept-Language': 'en',
          },
        });
        const data = await res.json();
        const list = (data || []).map((r) => ({
          id: r.place_id,
          label: r.display_name,
          lat: Number(r.lat),
          lng: Number(r.lon),
          site: r.display_name.split(',').slice(0,  3).join(',').trim() || r.display_name,
        }));
        setItems(list);
        setOpen(true);
      } catch (err) {
        console.error('[LocationSearch]', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function pick(item) {
    setQuery(item.label);
    setOpen(false);
    onSelect?.({
      label: item.label,
      site: item.site,
      lat: item.lat,
      lng: item.lng,
    });
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className="filter-search" style={{ width: '100%' }}>
        <svg><use href="#i-search" /></svg>
        <input
          type="text"
          className="input"
          style={{ border: 'none', boxShadow: 'none', paddingLeft: 0 }}
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="icon-btn-sm"
            title="Clear"
            onClick={() => {
              setQuery('');
              setItems([]);
              setOpen(false);
              onSelect?.({ label: '', site: '', lat: null, lng: null });
            }}
          >
            ×
          </button>
        )}
      </div>
      {loading && (
        <div className="hint" style={{ marginTop: 6 }}>Searching…</div>
      )}
      {open && items.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 50,
            left: 0,
            right: 0,
            margin: '6px 0 0',
            padding: 0,
            listStyle: 'none',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                style={{
                  display: 'flex',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1.35,
                }}
              >
                <span style={{ flexShrink: 0 }}>📍</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="hint" style={{ marginTop: 6 }}>
        Powered by OpenStreetMap Nominatim
      </div>
    </div>
  );
}