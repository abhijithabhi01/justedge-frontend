export const PERMISSION_DEFS = [
  { key: 'monitor', label: 'Monitor sensors', desc: 'View live readings, battery, status and history', locked: true },
  { key: 'addSensor', label: 'Add sensors', desc: 'Register new boards to the fleet' },
  { key: 'editSensor', label: 'Edit sensors', desc: 'Update sensor details and settings' },
  { key: 'removeSensor', label: 'Remove sensors', desc: 'Delete sensors from the fleet' },
  { key: 'automations', label: 'Manage automations', desc: 'Create, edit and toggle automation rules' },
  { key: 'alerts', label: 'Manage alerts', desc: 'Resolve, snooze or dismiss alerts' },
  { key: 'manageUsers', label: 'Manage users', desc: 'Add, edit or remove platform users' },
  { key: 'exportData', label: 'Export data', desc: 'Download sensor & fleet reports' },
];

export function defaultPermissionsForRole(role) {
  if (role === 'Owner') {
    return { monitor: true, addSensor: true, editSensor: true, removeSensor: true, automations: true, alerts: true, manageUsers: true, exportData: true };
  }
  if (role === 'Manager') {
    return { monitor: true, addSensor: true, editSensor: true, removeSensor: false, automations: true, alerts: true, manageUsers: false, exportData: true };
  }
  return { monitor: true, addSensor: false, editSensor: false, removeSensor: false, automations: false, alerts: false, manageUsers: false, exportData: true }; // Viewer
}

export function ensurePermissions(u) {
  if (!u.permissions) u.permissions = defaultPermissionsForRole(u.role);
  return u.permissions;
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export function battColor(pct) {
  if (pct <= 15) return 'var(--danger)';
  if (pct <= 35) return 'var(--warn)';
  return 'var(--good)';
}

export function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.round(diff / 86400000);
}

export function boardById(catalog, id) {
  return catalog.find(b => b.id === id) || { name: id, conn: '—', probes: 0, desc: '' };
}

export function planById(plans, id) {
  return plans.find(p => p.id === id) || { name: id, desc: '' };
}

export function userById(users, id) {
  return users.find(u => u.id === id) || null;
}

export function ownerName(users, sensor) {
  const u = userById(users, sensor.assignedUserId);
  return u ? u.name : 'Unassigned';
}

export function nextId(prefix, list, field = 'id') {
  const nums = list
    .map(item => parseInt(String(item[field]).replace(/\D/g, ''), 10))
    .filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

// ---------- Super Admin: admin console roles & permissions ----------
export const ADMIN_ROLES = ['Superadmin', 'Admin'];

export const ADMIN_PERMISSION_DEFS = [
  { key: 'manageAdmins', label: 'Manage admin accounts', desc: 'Create, edit, suspend or remove admin accounts', locked: true },
  { key: 'manageAccessControl', label: 'Manage access control', desc: 'Change role permissions and account-level access' },
  { key: 'viewActivityLogs', label: 'View activity logs', desc: 'See the full audit trail of admin & platform actions' },
  { key: 'systemOversight', label: 'System oversight', desc: 'View and resolve security & oversight flags' },
  { key: 'manageUsers', label: 'Manage platform users', desc: 'Add, edit or remove customer accounts' },
  { key: 'manageSensors', label: 'Manage sensors', desc: 'Register, edit or remove fleet sensors' },
  { key: 'billingAccess', label: 'Billing & plans', desc: 'View and change subscription plans' },
  { key: 'exportData', label: 'Export data', desc: 'Download platform-wide reports' },
];

export function defaultAdminPermissionsForRole(role) {
  if (role === 'Superadmin') {
    return { manageAdmins: true, manageAccessControl: true, viewActivityLogs: true, systemOversight: true, manageUsers: true, manageSensors: true, billingAccess: true, exportData: true };
  }
  if (role === 'Admin') {
    return { manageAdmins: false, manageAccessControl: false, viewActivityLogs: true, systemOversight: true, manageUsers: true, manageSensors: true, billingAccess: true, exportData: true };
  }
  return { manageAdmins: false, manageAccessControl: false, viewActivityLogs: true, systemOversight: true, manageUsers: true, manageSensors: true, billingAccess: true, exportData: true };
}

export function ensureAdminPermissions(a) {
  if (!a.permissions) a.permissions = defaultAdminPermissionsForRole(a.role);
  return a.permissions;
}

export function nextAdminId(list) {
  const nums = list.map(a => parseInt(String(a.id).replace(/\D/g, ''), 10)).filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `AD-${String(next).padStart(3, '0')}`;
}

export function nextLogId(list) {
  const nums = list.map(l => parseInt(String(l.id).replace(/\D/g, ''), 10)).filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `LOG-${next}`;
}

export function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function severityPillClass(sev) {
  if (sev === 'critical') return 'pill-bad';
  if (sev === 'warn') return 'pill-warn';
  return 'pill-muted';
}

export function isValidMac(mac) {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac);
}

export function formatMacInput(raw) {
  const hex = raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 12);
  return hex.match(/.{1,2}/g)?.join(':') || '';
}
