import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      await signIn(data)
      toast.success('¡Bienvenido de vuelta!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 0 30px var(--purple-glow)',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>D</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Bienvenido a <span className="gradient-text">DevSpec Pro</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Inicia sesión para continuar</p>
        </div>

        <div className="card" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email */}
            <div className="form-group">
              <label className="label">Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  {...register('email')}
                  type="email"
                  className={`input ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: 36 }}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && <span className="error-msg">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className={`input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 36, paddingRight: 36 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password.message}</span>}
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--purple-light)', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <><div className="spinner" /> Iniciando…</> : <>Iniciar sesión <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--purple-light)', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate gratis
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
