import React from 'react';

const TITLES = {
  overview: ['Overview', 'Your fleet at a glance'],
  sensors: ['My Sensors', 'Sensors assigned to you'],
  alerts: ['Alerts', 'Notifications from your sensors'],
  automations: ['Automations', 'Rules that watch your sensors for you'],
};

export default function UserTopbar({ view, onMenuClick }) {
  const [title, sub] = TITLES[view] || TITLES.overview;

  return (
    <header className="topbar">
      <button className="icon-btn mobile-menu-btn" onClick={onMenuClick} title="Open menu">
        <svg><use href="#i-menu" /></svg>
      </button>
      <div><div className="page-title">{title}</div><div className="page-sub">{sub}</div></div>
      <div className="topbar-spacer"></div>
    </header>
  );
}