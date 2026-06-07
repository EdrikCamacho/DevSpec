import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const schema = z.object({
  full_name: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono inválido').optional().or(z.literal('')),
  city: z.string().min(2, 'Ciudad requerida'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

function Field({ id, label, error, children, style }) {
  return (
    <div className="form-group" style={style}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      {children}
      {error && <span className="error-msg">{error}</span>}
    </div>
  )
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ confirm, ...data }) {
    setLoading(true)
    try {
      await signUp(data)
      toast.success('¡Cuenta creada! Verifica tu correo si es necesario.')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                fontSize: '0.75rem',
                color: 'var(--accent)',
              }}>D/</span>
            </div>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--text-primary)',
            }}>
              DevSpec<em style={{ color: 'var(--accent)', fontStyle: 'italic' }}> Pro</em>
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.625rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: '0.5rem',
          }}>
            Crea tu cuenta
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Únete y empieza a gestionar tus proyectos con IA
          </p>
        </div>

        {/* Form card */}
        <div className="auth-card">
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Row: nombre + ciudad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <Field id="reg-name" label="Nombre completo" error={errors.full_name?.message}>
                <input
                  id="reg-name"
                  {...register('full_name')}
                  className={`input ${errors.full_name ? 'error' : ''}`}
                  placeholder="Juan Pérez"
                  autoComplete="name"
                />
              </Field>
              <Field id="reg-city" label="Ciudad" error={errors.city?.message}>
                <input
                  id="reg-city"
                  {...register('city')}
                  className={`input ${errors.city ? 'error' : ''}`}
                  placeholder="Ciudad de México"
                />
              </Field>
            </div>

            {/* Email */}
            <Field id="reg-email" label="Correo electrónico" error={errors.email?.message}>
              <input
                id="reg-email"
                {...register('email')}
                type="email"
                className={`input ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </Field>

            {/* Teléfono */}
            <Field id="reg-phone" label="Teléfono — opcional" error={errors.phone?.message}>
              <input
                id="reg-phone"
                {...register('phone')}
                type="tel"
                className="input"
                placeholder="+52 555 000 0000"
                autoComplete="tel"
              />
            </Field>

            {/* Divider visual */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              margin: '0.25rem 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span className="section-label">Seguridad</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Row: contraseñas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <Field id="reg-pass" label="Contraseña" error={errors.password?.message}>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-pass"
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    className={`input ${errors.password ? 'error' : ''}`}
                    style={{ paddingRight: '2.75rem' }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    id="toggle-pass-register"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '0.25rem',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPass ? <EyeOff size={13} strokeWidth={1.75} /> : <Eye size={13} strokeWidth={1.75} />}
                  </button>
                </div>
              </Field>

              <Field id="reg-confirm" label="Confirmar" error={errors.confirm?.message}>
                <input
                  id="reg-confirm"
                  {...register('confirm')}
                  type={showPass ? 'text' : 'password'}
                  className={`input ${errors.confirm ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {loading
                ? <><div className="spinner" style={{ borderTopColor: '#0D1117' }} /> Creando cuenta…</>
                : <>Crear cuenta <ArrowRight size={15} strokeWidth={2} /></>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Iniciar sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
