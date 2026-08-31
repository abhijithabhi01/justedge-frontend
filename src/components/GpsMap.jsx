import React, { useEffect, useRef } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.L) return Promise.resolve(window.L);

  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

/**
 * Live GPS map — single location pointer only (no route line).
 * compact=true strips outer card chrome for drawer use.
 */
export default function GpsMap({
  latitude,
  longitude,
  label = 'GPS location',
  height = 320,
  compact = false,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));

  const lat = hasCoords ? Number(latitude) : null;
  const lng = hasCoords ? Number(longitude) : null;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) return;

        if (!mapInstance.current) {
          const map = L.map(mapRef.current, {
            zoomControl: true,
            attributionControl: true,
          });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }).addTo(map);
          mapInstance.current = map;

          if (hasCoords) {
            map.setView([lat, lng], 14);
          } else {
            // Default view near Mysuru until first fix arrives
            map.setView([12.3, 76.65], 10);
          }
        }

        const map = mapInstance.current;

        if (hasCoords) {
          if (!markerRef.current) {
            const icon = L.divIcon({
              className: '',
              html: `<div style="
                width:18px;height:18px;border-radius:50%;
                background:#f59e0b;border:3px solid #fff;
                box-shadow:0 1px 6px rgba(0,0,0,.45);
              "></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            });
            markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
            markerRef.current.bindPopup(
              `<strong>${label}</strong><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`
            );
            map.setView([lat, lng], 14);
          } else {
            markerRef.current.setLatLng([lat, lng]);
            markerRef.current.setPopupContent(
              `<strong>${label}</strong><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`
            );
            map.panTo([lat, lng], { animate: true });
          }
        }

        setTimeout(() => map.invalidateSize(), 80);
      } catch (err) {
        console.error('[GpsMap]', err);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, label, hasCoords]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const googleLink = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : null;

  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: compact ? 10 : 0,
      }}
    >
      <div>
        {compact ? (
          <div className="drawer-section" style={{ marginBottom: 4 }}>
            Live location
          </div>
        ) : (
          <div className="card-title">Live location</div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
          {hasCoords ? (
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>
              {label} · {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          ) : (
            'Waiting for GPS coordinates…'
          )}
        </div>
      </div>
      {hasCoords && (
        <a
          className="btn btn-ghost"
          href={googleLink}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12 }}
        >
          Open in Maps
        </a>
      )}
    </div>
  );

  const mapBox = (
    <div
      ref={mapRef}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border-soft, var(--border))',
        height,
        background: 'var(--surface-2, #e8eef5)',
        width: '100%',
        zIndex: 0,
      }}
    />
  );

  if (compact) {
    return (
      <div>
        {header}
        {mapBox}
        {!hasCoords && (
          <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 8 }}>
            No latitude / longitude yet. Start the GPS simulator or wait for the board.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card section-gap">
      <div className="card-head" style={{ flexWrap: 'wrap' }}>
        {header}
      </div>
      {mapBox}
      {!hasCoords && (
        <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 10, padding: '0 4px' }}>
          No live fix yet. Run the GPS simulator to see the board location.
        </p>
      )}
    </div>
  );
}