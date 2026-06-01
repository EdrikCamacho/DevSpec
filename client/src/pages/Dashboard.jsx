import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, FolderKanban, FileText, GitBranch, Users, ArrowRight, Clock, Zap } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#7C3AED', '#a78bfa', '#60a5fa', '#34d399', '#f59e0b']

function MetricCard({ icon: Icon, value, label, color = 'var(--purple)' }) {
  return (
    <motion.div
      className="metric-card"
      whileHover={{ y: -3 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="metric-value">{value ?? '—'}</div>
      <div className="metric-label">{label}</div>
    </motion.div>
  )
}

function ProjectCard({ project, isCollaborating, onClick }) {
  const priority = { alta: 'badge-red', media: 'badge-yellow', baja: 'badge-green' }

  return (
    <motion.div
      className="card card-glow"
      whileHover={{ y: -3 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description || 'Sin descripción'}
          </p>
        </div>
        <span className={`badge ${priority[project.priority] || 'badge-gray'}`} style={{ marginLeft: '0.75rem', flexShrink: 0 }}>
          {project.priority}
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
        <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>{project.progress || 0}% completado</span>
        <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: es })}</span>
      </div>

      {isCollaborating && (
        <div style={{ marginTop: '0.5rem' }}>
          <span className="badge badge-blue">Colaborador · {project.member_role}</span>
        </div>
      )}
    </motion.div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ owned: [], collaborating: [] })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: projects } = await api.get('/projects')
      setData(projects)

      // Aggregate global stats
      const totalProjects = projects.owned.length + projects.collaborating.length
      setStats({ totalProjects, owned: projects.owned.length, collaborating: projects.collaborating.length })
    } catch (e) {
      toast.error('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  const allProjects = [...(data.owned || []), ...(data.collaborating || [])]

  const phaseData = [
    { name: 'Levantamiento', value: 40 },
    { name: 'Diseño', value: 35 },
    { name: 'Exportar', value: 25 },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Hola, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Desarrollador'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Aquí está el resumen de tus proyectos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary"
          onClick={() => navigate('/projects/new')}
          style={{ gap: '0.5rem' }}
        >
          <PlusCircle size={18} />
          Nuevo Proyecto
        </motion.button>
      </motion.div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard icon={FolderKanban} value={data.owned?.length} label="Mis Proyectos" color="var(--purple)" />
        <MetricCard icon={Users} value={data.collaborating?.length} label="Colaboraciones" color="#60a5fa" />
        <MetricCard icon={FileText} value={allProjects.length} label="Total Proyectos" color="#34d399" />
        <MetricCard icon={Zap} value="IA" label="Generación UML" color="#f59e0b" />
      </div>

      {/* Charts + Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Projects list */}
        <div>
          {/* Owned */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Mis Proyectos</h2>
            <span className="badge badge-purple">{data.owned?.length}</span>
          </div>

          {data.owned?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <FolderKanban size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Aún no tienes proyectos</p>
              <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
                <PlusCircle size={16} /> Crear primer proyecto
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {data.owned.map(p => (
                <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
              ))}
            </div>
          )}

          {/* Collaborating */}
          {data.collaborating?.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Proyectos como Colaborador</h2>
                <span className="badge badge-blue">{data.collaborating.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {data.collaborating.map(p => (
                  <ProjectCard key={p.id} project={p} isCollaborating onClick={() => navigate(`/projects/${p.id}`)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Charts sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Phase distribution */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Distribución por Fase</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={phaseData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {phaseData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
              {phaseData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Acciones Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Nuevo Proyecto', icon: PlusCircle, action: () => navigate('/projects/new') },
                { label: 'Directorio de Usuarios', icon: Users, action: () => navigate('/directory') },
              ].map(({ label, icon: Icon, action }) => (
                <button key={label} className="btn btn-secondary" onClick={action} style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon size={15} style={{ color: 'var(--purple-light)' }} /> {label}
                  </span>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
