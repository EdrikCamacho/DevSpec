import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { CheckCircle, ChevronRight, ChevronLeft, FolderKanban, ArrowRight, Zap } from 'lucide-react'

const STEPS = ['Información básica', 'Vista previa del flujo', 'Confirmar y crear']

const PRIORITY_OPTS = [
  { value: 'alta',  label: 'Alta',  color: 'var(--danger)',  desc: 'Entrega urgente o crítica' },
  { value: 'media', label: 'Media', color: 'var(--warning)', desc: 'Plazo normal de desarrollo' },
  { value: 'baja',  label: 'Baja',  color: 'var(--success)', desc: 'Sin fecha límite inmediata' },
]

const FLOW_STEPS = [
  { icon: '📋', title: 'Levantamiento', desc: 'Stakeholders, actores, procesos y recolección de información' },
  { icon: '🎨', title: 'Diseño', desc: 'Requerimientos y diagramas UML generados por IA' },
  { icon: '🚀', title: 'Exportar para IA', desc: 'Master Prompt, demo builder y exportación profesional' },
]

export default function CreateProjectWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', priority: 'media', visibility: 'private',
  })

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleCreate() {
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    setLoading(true)
    try {
      const { data } = await api.post('/projects', form)
      toast.success(`¡Proyecto "${data.name}" creado!`)
      navigate(`/projects/${data.id}`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Crear Nuevo Proyecto</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Sigue los pasos para configurar tu espacio de trabajo</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: i < step ? 'var(--success)' : i === step ? 'var(--purple)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s',
            }}>
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span style={{ fontSize: '0.8rem', color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--border)', borderRadius: 1, transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1 */}
          {step === 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                <FolderKanban size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--purple-light)' }} />
                Información del Proyecto
              </h2>

              <div className="form-group">
                <label className="label">Nombre del proyecto *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Sistema de gestión de inventario" maxLength={100} />
              </div>

              <div className="form-group">
                <label className="label">Descripción</label>
                <textarea className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="¿Qué problema resuelve este proyecto?" rows={4} style={{ resize: 'vertical' }} />
              </div>

              <div className="form-group">
                <label className="label">Prioridad inicial</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {PRIORITY_OPTS.map(({ value, label, color, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('priority', value)}
                      style={{
                        padding: '0.875rem', borderRadius: 10, border: `2px solid ${form.priority === value ? color : 'var(--border)'}`,
                        background: form.priority === value ? `${color}15` : 'var(--bg-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <div style={{ fontWeight: 700, color, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Visibilidad</label>
                <select className="input" value={form.visibility} onChange={e => set('visibility', e.target.value)}>
                  <option value="private">🔒 Privado — Solo tú y tus colaboradores</option>
                  <option value="public">🌐 Público — Visible en el directorio</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card">
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                  <Zap size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--purple-light)' }} />
                  Flujo de Trabajo en DevSpec Pro
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {FLOW_STEPS.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {s.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontSize: '0.8rem' }}>0{i + 1}</span>
                          {s.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
                      </div>
                      {i < FLOW_STEPS.length - 1 && (
                        <div style={{ position: 'absolute', left: 24, top: '100%', width: 2, height: 16, background: 'var(--border)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="card">
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                <CheckCircle size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--success)' }} />
                Confirmar Creación
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  ['Nombre', form.name],
                  ['Descripción', form.description || 'Sin descripción'],
                  ['Prioridad', form.priority],
                  ['Visibilidad', form.visibility],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleCreate}
                disabled={loading || !form.name.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? <><div className="spinner" /> Creando proyecto…</> : <>Crear Proyecto <ArrowRight size={16} /></>}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setStep(p => Math.max(0, p - 1))}
          disabled={step === 0}
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        {step < STEPS.length - 1 && (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (step === 0 && !form.name.trim()) return toast.error('El nombre es obligatorio')
              setStep(p => p + 1)
            }}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
