import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ToastContainer from './ToastContainer'

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const IconClipboardList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M6 5H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
)

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconBuilding = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 22V12h6v10" />
    <path d="M9 7h1M14 7h1M9 11h1M14 11h1" />
  </svg>
)

const IconBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const IconWrench = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

const IconLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

// ─── Nav Configuration ───────────────────────────────────────────────────────

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const INTERNAL_NAV: NavItem[] = [
  { label: 'Asset Definitions', path: '/internal/definitions', icon: <IconClipboardList /> },
  { label: 'Create Definition',  path: '/internal/definitions/new', icon: <IconPlus /> },
]

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Assets',         path: '/customer/assets',     icon: <IconBuilding /> },
  { label: 'Add Asset',      path: '/customer/assets/new', icon: <IconPlus /> },
  { label: 'Browse Catalog', path: '/customer/catalog',    icon: <IconBook /> },
]

const TECHNICIAN_NAV: NavItem[] = [
  { label: 'Work Orders', path: '/technician/workorders', icon: <IconWrench /> },
]

const PERSONA_LABELS: Record<string, string> = {
  'internal-admin': 'Catalog Admin',   // renamed from "Internal Admin"
  'customer-admin': 'Customer Admin',
  'technician':     'WO Technician',
}

const PERSONA_ROLES: Record<string, string> = {
  'internal-admin': 'Siemens Internal',
  'customer-admin': 'Facility Management',
  'technician':     'Maintenance',
}

// ─── Persona Avatar Initials ─────────────────────────────────────────────────

const PERSONA_INITIALS: Record<string, string> = {
  'internal-admin': 'CA',
  'customer-admin': 'FA',
  'technician':     'WO',
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { persona, setPersona } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = persona === 'internal-admin' ? INTERNAL_NAV
    : persona === 'customer-admin' ? CUSTOMER_NAV
    : TECHNICIAN_NAV

  return (
    <div className="page-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-text">CAMS</div>
          <div className="logo-sub">Asset Management</div>
        </div>

        {/* Persona section */}
        {persona && (
          <div className="sidebar-persona-section">
            <div className="sidebar-persona-avatar">
              {PERSONA_INITIALS[persona] ?? 'U'}
            </div>
            <div className="sidebar-persona-info">
              <div className="sidebar-persona-name">{PERSONA_LABELS[persona]}</div>
              <div className="sidebar-persona-role">{PERSONA_ROLES[persona]}</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(item => (
            <div
              key={item.path}
              className={`sidebar-nav-item ${location.pathname === item.path || (location.pathname.startsWith(item.path + '/') && !item.path.endsWith('/new')) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Footer — switch persona */}
        <div className="sidebar-footer">
          <button
            className="switch-persona-btn"
            onClick={() => { setPersona(null); navigate('/') }}
          >
            <IconLogOut />
            <span>Switch Persona</span>
          </button>
        </div>

      </aside>

      {/* ── Main content ── */}
      <div className="main-content">
        <div className="page-content">
          {children}
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
