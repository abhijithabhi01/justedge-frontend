import React from 'react';

export default function Drawer({ open, title, sub, onClose, children }) {
  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}></div>
      <div className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-head">
          <div><div className="drawer-title">{title || '—'}</div><div className="drawer-sub">{sub || '—'}</div></div>
          <button className="drawer-close" onClick={onClose}><svg><use href="#i-x" /></svg></button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}
