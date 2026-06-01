import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Lock, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) return toast.error('Las contraseñas no coinciden')
    if (password.length < 8) return toast.error('Mínimo 8 caracteres')
    setLoading(true)
    try {
      await updatePassword(password)
      toast.success('¡Contraseña actualizada!')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Nueva contraseña</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[['Nueva contraseña', password, setPassword], ['Confirmar contraseña', confirm, setConfirm]].map(([label, val, setter]) => (
              <div className="form-group" key={label}>
                <label className="label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" className="input" style={{ paddingLeft: 36 }} value={val} onChange={e => setter(e.target.value)} placeholder="••••••••" required minLength={8} />
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <><div className="spinner" /> Actualizando…</> : <>Actualizar contraseña <CheckCircle size={16} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
