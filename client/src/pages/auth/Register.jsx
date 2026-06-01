import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ArrowRight } from 'lucide-react'
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

function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
        {children}
      </div>
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 0 30px var(--purple-glow)',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>D</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Crear cuenta en <span className="gradient-text">DevSpec Pro</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comienza a gestionar tus proyectos con IA</p>
        </div>

        <div className="card" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Nombre completo" icon={User} error={errors.full_name?.message}>
                <input {...register('full_name')} className={`input ${errors.full_name ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="Juan Pérez" />
              </Field>
              <Field label="Ciudad" icon={MapPin} error={errors.city?.message}>
                <input {...register('city')} className={`input ${errors.city ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="Ciudad de México" />
              </Field>
            </div>

            <Field label="Correo electrónico" icon={Mail} error={errors.email?.message}>
              <input {...register('email')} type="email" className={`input ${errors.email ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="tu@email.com" />
            </Field>

            <Field label="Teléfono (opcional)" icon={Phone} error={errors.phone?.message}>
              <input {...register('phone')} type="tel" className="input" style={{ paddingLeft: 36 }} placeholder="+52 555 000 0000" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Contraseña" icon={Lock} error={errors.password?.message}>
                <input {...register('password')} type={showPass ? 'text' : 'password'} className={`input ${errors.password ? 'error' : ''}`} style={{ paddingLeft: 36, paddingRight: 36 }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>
              <Field label="Confirmar contraseña" icon={Lock} error={errors.confirm?.message}>
                <input {...register('confirm')} type={showPass ? 'text' : 'password'} className={`input ${errors.confirm ? 'error' : ''}`} style={{ paddingLeft: 36 }} placeholder="••••••••" />
              </Field>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? <><div className="spinner" /> Creando cuenta…</> : <>Crear cuenta <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--purple-light)', textDecoration: 'none', fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
