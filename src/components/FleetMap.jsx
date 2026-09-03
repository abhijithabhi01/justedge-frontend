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
 * Multi-marker map for Superadmin fleet overview.
 * markers: [{ id, lat, lng, label, status }]
 */
export default function FleetMap({ markers = [], height = 360, title = 'All device locations' }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);

  const points = (markers || [])
    .map((m) => {
      const lat = Number(m.lat ?? m.latitude);
      const lng = Number(m.lng ?? m.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { ...m, lat, lng };
    })
    .filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) return;
        if (!mapInstance.current) {
          const map = L.map(mapRef.current, { zoomControl: true });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap',
          }).addTo(map);
          mapInstance.current = map;
          layerRef.current = L.layerGroup().addTo(map);
        }
        const map = mapInstance.current;
        const layer = layerRef.current;
        layer.clearLayers();
        if (!points.length) {
          map.setView([12.97, 77.59], 10);
          setTimeout(() => map.invalidateSize(), 80);
          return;
        }
        const bounds = [];
        points.forEach((p) => {
          const color = p.status === 'online' ? '#16a34a' : p.status === 'offline' ? '#dc2626' : '#f59e0b';
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const marker = L.marker([p.lat, p.lng], { icon }).addTo(layer);
          marker.bindPopup(
            `<strong>${p.label || p.name || p.id || 'Device'}</strong><br/>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`
          );
          bounds.push([p.lat, p.lng]);
        });
        if (bounds.length === 1) map.setView(bounds[0], 14);
        else map.fitBounds(bounds, { padding: [28, 28] });
        setTimeout(() => map.invalidateSize(), 80);
      } catch (err) {
        console.error('[FleetMap]', err);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(points)]);

  useEffect(
    () => () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        layerRef.current = null;
      }
    },
    []
  );

  return (
    <div className="card section-gap">
      <div className="card-title">{title}</div>
      <div className="card-title-sub">
        {points.length
          ? `${points.length} device${points.length !== 1 ? 's' : ''} with GPS coordinates`
          : 'No devices reporting coordinates yet'}
      </div>
      <div
        ref={mapRef}
        style={{ height, width: '100%', borderRadius: 12, marginTop: 12, zIndex: 0 }}
      />
    </div>
  );
}