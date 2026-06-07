import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Correo enviado. Revisa tu bandeja.')
    } catch (err) {
      toast.error(err.message || 'Error al enviar correo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 0 30px var(--purple-glow)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>D</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Recuperar contraseña</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Te enviaremos un enlace de recuperación</p>
        </div>

        <div className="card">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <Send size={40} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Correo enviado</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Revisa tu bandeja de entrada y sigue las instrucciones.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="label">Correo electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="input" style={{ paddingLeft: '2.75rem' }} placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><div className="spinner" /> Enviando…</> : <>Enviar enlace <Send size={16} /></>}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--purple-light)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} /> Volver al login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
