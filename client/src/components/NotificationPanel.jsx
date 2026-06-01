import { useNotifications } from '../contexts/NotificationContext'
import { Bell, X, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'

export default function NotificationPanel({ onClose }) {
  const { notifications, markRead, markAllRead } = useNotifications()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      style={{
        position: 'absolute', top: '110%', right: 0,
        width: 360, maxHeight: 480, overflow: 'hidden',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <Bell size={16} style={{ color: 'var(--purple-light)' }} />
          Notificaciones
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', gap: '0.3rem' }}>
            <CheckCheck size={14} /> Marcar todas
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.35rem' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.875rem' }}>Sin notificaciones</p>
          </div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              background: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.06)',
              transition: 'background 0.15s',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}
          >
            {!n.read && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)',
                flexShrink: 0, marginTop: 6,
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{n.message}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
