import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FolderKanban, Users, Bell, User,
  Sun, Moon, Menu, X, LogOut, ChevronLeft
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationContext'
import NotificationPanel from '../NotificationPanel'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FolderKanban,    label: 'Proyectos',  path: '/dashboard' },
  { icon: Users,           label: 'Directorio', path: '/directory' },
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

  const sidebarWidth = sidebarOpen ? 220 : 64

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <motion.aside
        className="sidebar"
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ width: sidebarWidth, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.125rem', marginBottom: '0.5rem', overflow: 'hidden' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 0 20px var(--purple-glow)',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>D</span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
              >
                DevSpec <span className="gradient-text">Pro</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="sidebar-item"
          style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          {sidebarOpen && <span>Colapsar</span>}
        </button>

        <hr className="divider" style={{ margin: '0.25rem 0' }} />

        {/* Nav items */}
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`sidebar-item ${location.pathname === path ? 'active' : ''}`}
            style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <hr className="divider" />

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="sidebar-item" style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
            {theme === 'dark' ? <Sun size={18} style={{ flexShrink: 0 }} /> : <Moon size={18} style={{ flexShrink: 0 }} />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>

          {/* Profile */}
          <button onClick={() => navigate('/profile')} className="sidebar-item" style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} className="avatar" alt="avatar" />
              : <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem', flexShrink: 0 }}>{getInitials(profile?.full_name)}</div>
            }
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.full_name || 'Mi Perfil'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.city || 'Sin ciudad'}
                </div>
              </div>
            )}
          </button>

          {/* Sign out */}
          <button onClick={signOut} className="sidebar-item" style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', color: 'var(--danger)' }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div style={{ marginLeft: sidebarWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s ease', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(15, 15, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem',
        }}>
          {/* Notifications bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(p => !p)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'var(--danger)', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          <button onClick={() => navigate('/profile')} className="btn btn-ghost btn-sm" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <User size={18} />
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
