import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, FolderKanban, FileText, Users, ArrowRight, Zap } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const CHART_COLORS = ['#58A6FF', '#3FB950', '#D29922']

/* ─── Metric Card ──────────────────────────────── */
function MetricCard({ icon: Icon, value, label, index }) {
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Icon size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
        <span className="section-label">métrica</span>
      </div>
      <div className="metric-value">{value ?? '—'}</div>
      <div className="metric-label">{label}</div>
    </motion.div>
  )
}

/* ─── Project Card ─────────────────────────────── */
function ProjectCard({ project, isCollaborating, onClick, index }) {
  const priorityBadge = { alta: 'badge-red', media: 'badge-yellow', baja: 'badge-green' }
  const progress = project.progress || 0
  const relTime = formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: es })

  return (
    <motion.div
      className="card card-interactive"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
            marginBottom: '0.25rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {project.name}
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {project.description || 'Sin descripción'}
          </p>
        </div>
        <span className={`badge ${priorityBadge[project.priority] || 'badge-gray'}`} style={{ flexShrink: 0 }}>
          {project.priority}
        </span>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: '0.625rem' }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Bottom meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="timestamp">{progress}% completado</span>
        <span className="timestamp">{relTime}</span>
      </div>

      {isCollaborating && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-muted)' }}>
          <span className="badge badge-blue">colaborador · {project.member_role}</span>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Custom Tooltip ───────────────────────────── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#010409',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '0.375rem 0.625rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6875rem',
      color: 'var(--text-primary)',
    }}>
      {payload[0].name}: <strong>{payload[0].value}%</strong>
    </div>
  )
}

/* ─── Dashboard ────────────────────────────────── */
export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ owned: [], collaborating: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const { data: projects } = await api.get('/projects')
      setData(projects)
    } catch {
      toast.error('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  const allProjects = [...(data.owned || []), ...(data.collaborating || [])]

  const phaseData = [
    { name: 'Levantamiento', value: 40 },
    { name: 'Diseño',        value: 35 },
    { name: 'Exportar',      value: 25 },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || 'Desarrollador'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <p className="section-label" style={{ marginBottom: '0.5rem' }}>resumen general</p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
          }}>
            Hola, {firstName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.375rem' }}>
            {allProjects.length === 0
              ? 'Empieza creando tu primer proyecto.'
              : `Tienes ${allProjects.length} proyecto${allProjects.length !== 1 ? 's' : ''} activo${allProjects.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>

        <button
          id="new-project-btn"
          className="btn btn-primary"
          onClick={() => navigate('/projects/new')}
        >
          <PlusCircle size={14} strokeWidth={2} />
          Nuevo Proyecto
        </button>
      </motion.div>

      {/* ── Metrics ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.875rem',
        marginBottom: '2.5rem',
      }}>
        <MetricCard icon={FolderKanban} value={data.owned?.length}          label="Mis Proyectos"   index={0} />
        <MetricCard icon={Users}        value={data.collaborating?.length}  label="Colaboraciones"  index={1} />
        <MetricCard icon={FileText}     value={allProjects.length}           label="Total"           index={2} />
        <MetricCard icon={Zap}          value="IA"                           label="Generación UML"  index={3} />
      </div>

      {/* ── Main grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 272px',
        gap: '1.5rem',
        alignItems: 'start',
      }}>

        {/* Projects column */}
        <div>
          {/* Owned */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            marginBottom: '1rem',
          }}>
            <span className="section-label">mis proyectos</span>
            <span className="count-pill">{data.owned?.length ?? 0}</span>
          </div>

          {data.owned?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <FolderKanban size={32} strokeWidth={1.25} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Aún no tienes proyectos
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
                <PlusCircle size={14} strokeWidth={2} />
                Crear primer proyecto
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
              gap: '0.875rem',
              marginBottom: '2rem',
            }}>
              {data.owned.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  onClick={() => navigate(`/projects/${p.id}`)}
                />
              ))}
            </div>
          )}

          {/* Collaborating */}
          {data.collaborating?.length > 0 && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                margin: '1.5rem 0 1rem',
              }}>
                <span className="section-label">colaboraciones</span>
                <span className="count-pill">{data.collaborating.length}</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
                gap: '0.875rem',
              }}>
                {data.collaborating.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isCollaborating
                    index={i}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Phase chart */}
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <span className="section-label">distribución por fase</span>
            </div>
            <ResponsiveContainer width="100%" height={148}>
              <PieChart>
                <Pie
                  data={phaseData}
                  cx="50%" cy="50%"
                  innerRadius={42} outerRadius={64}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {phaseData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.75rem' }}>
              {phaseData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: CHART_COLORS[i],
                    flexShrink: 0,
                  }} />
                  <span className="timestamp" style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6875rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <span className="section-label">acciones rápidas</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[
                { label: 'Nuevo Proyecto',       icon: PlusCircle, action: () => navigate('/projects/new') },
                { label: 'Directorio de Usuarios', icon: Users,    action: () => navigate('/directory') },
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  className="btn btn-secondary"
                  onClick={action}
                  style={{ justifyContent: 'space-between', width: '100%' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon size={13} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
                    {label}
                  </span>
                  <ArrowRight size={12} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
