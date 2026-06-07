import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FolderKanban, Users, Bell, User,
  Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationContext'
import NotificationPanel from '../NotificationPanel'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard', lineNo: '01' },
  { icon: FolderKanban,    label: 'Proyectos',  path: '/projects',  lineNo: '02' },
  { icon: Users,           label: 'Directorio', path: '/directory', lineNo: '03' },
]

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const W = sidebarOpen ? 224 : 52

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        className="sidebar"
        animate={{ width: W }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: W }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 0.5rem' }}>

          {/* Logo / Brand */}
          <div style={{
            padding: '1rem 0.25rem 0.75rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '0.5rem',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {/* Logo mark */}
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}>D/</span>
              </div>

              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}>
                      DevSpec
                      <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}> Pro</span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.5625rem',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginTop: '0.0625rem',
                    }}>workspace</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Nav section label */}
          {sidebarOpen && (
            <div className="sidebar-section-label" style={{ paddingTop: '0.5rem' }}>
              Navegación
            </div>
          )}

          {/* Nav items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {navItems.map(({ icon: Icon, label, path, lineNo }) => {
              const isActive = location.pathname === path ||
                (path === '/dashboard' && location.pathname === '/dashboard')
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
                  title={!sidebarOpen ? label : undefined}
                >
                  {/* Line number gutter */}
                  {sidebarOpen && (
                    <span className="sidebar-line-gutter">{lineNo}</span>
                  )}
                  <Icon size={15} style={{ flexShrink: 0 }} strokeWidth={1.75} />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ fontSize: '0.8125rem' }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div style={{ marginTop: 'auto', paddingBottom: '0.75rem' }}>
            <div style={{ borderTop: '1px solid var(--border)', marginBottom: '0.5rem', paddingTop: '0.5rem' }}>

              {/* Toggle collapse */}
              <button
                onClick={() => setSidebarOpen(p => !p)}
                className="sidebar-item"
                style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
                title={sidebarOpen ? 'Colapsar' : 'Expandir'}
              >
                {sidebarOpen
                  ? <PanelLeftClose size={15} strokeWidth={1.75} />
                  : <PanelLeftOpen size={15} strokeWidth={1.75} />
                }
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Colapsar
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="sidebar-item"
                style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark'
                  ? <Sun size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                  : <Moon size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                }
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Profile row */}
            <button
              onClick={() => navigate('/profile')}
              className="sidebar-item"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="avatar" alt="avatar" style={{ width: 26, height: 26 }} />
                : (
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.625rem', flexShrink: 0 }}>
                    {getInitials(profile?.full_name)}
                  </div>
                )
              }
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}
                  >
                    <div className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {profile?.full_name || 'Mi Perfil'}
                    </div>
                    <div className="truncate timestamp" style={{ marginTop: '0.0625rem' }}>
                      {profile?.city || 'Sin ciudad'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Sign out */}
            <button
              onClick={signOut}
              className="sidebar-item"
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', color: 'var(--danger)' }}
              title="Cerrar sesión"
            >
              <LogOut size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Cerrar sesión
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div style={{
        marginLeft: W,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 0.2s ease',
        minWidth: 0,
      }}>
        {/* Topbar */}
        <header className="topbar">
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              id="notif-btn"
              onClick={() => setNotifOpen(p => !p)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.375rem', borderRadius: 6, position: 'relative' }}
            >
              <Bell size={15} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 13, height: 13,
                  fontSize: '0.5625rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.375rem', borderRadius: 6 }}
          >
            <User size={15} strokeWidth={1.75} />
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '2rem', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
