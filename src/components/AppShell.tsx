import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ToastContainer from './ToastContainer'

interface NavItem {
  label: string
  path: string
  icon: string
}

const INTERNAL_NAV: NavItem[] = [
  { label: 'Asset Definitions', path: '/internal/definitions', icon: '📋' },
  { label: 'Create Definition', path: '/internal/definitions/new', icon: '＋' },
]

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Assets', path: '/customer/assets', icon: '🏭' },
  { label: 'Add Asset', path: '/customer/assets/new', icon: '＋' },
  { label: 'Browse Catalog', path: '/customer/catalog', icon: '📂' },
]

const TECHNICIAN_NAV: NavItem[] = [
  { label: 'Work Orders', path: '/technician/workorders', icon: '🔧' },
]

const PERSONA_LABELS: Record<string, string> = {
  'internal-admin': 'Internal Admin',
  'customer-admin': 'Customer Admin',
  'technician': 'WO Technician',
}

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

  const handleNav = (path: string) => {
    navigate(path)
  }

  return (
    <div className="page-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">CAMS</div>
          <div className="logo-sub">Asset Management</div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(item => (
            <div
              key={item.path}
              className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="main-content">
        <div className="top-bar">
          <span className="top-bar-title">CAMS Prototype</span>
          <div className="top-bar-right">
            <span>Logged in as: Demo User</span>
            {persona && <span className="persona-badge">{PERSONA_LABELS[persona]}</span>}
          </div>
        </div>

        <div className="page-content">
          {children}
        </div>
      </div>

      {/* Switch persona floating button */}
      <button className="switch-persona-btn" onClick={() => { setPersona(null); navigate('/') }}>
        ↩ Switch Persona
      </button>

      <ToastContainer />
    </div>
  )
}
