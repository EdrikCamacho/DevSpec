import { useEffect, useState } from 'react'
import { Routes, Route, useParams, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, History, UserCircle, Bot, Settings,
  FileText, GitBranch, Download, ChevronLeft, PenTool, Box,
  Activity, Globe, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// Workspace pages
import Overview from '../workspace/Overview'
import Team from '../workspace/Team'
import AuditLog from '../workspace/AuditLog'
import Stakeholders from '../workspace/Stakeholders'
import Actors from '../workspace/Actors'
import Processes from '../workspace/Processes'
import Collection from '../workspace/Collection'
import Requirements from '../workspace/Requirements'
import UMLDiagrams from '../workspace/UMLDiagrams'
import ExportPage from '../workspace/Export'
import DemoBuilder from '../workspace/DemoBuilder'
import GitHub from '../workspace/GitHub'

const NAV = [
  {
    section: 'GESTIÓN',
    items: [
      { icon: LayoutDashboard, label: 'Visión General', path: '' },
      { icon: Users, label: 'Equipo', path: 'team' },
      { icon: History, label: 'Historial', path: 'audit' },
    ],
  },
  {
    section: 'LEVANTAMIENTO',
    items: [
      { icon: UserCircle, label: 'Stakeholders', path: 'stakeholders' },
      { icon: Bot, label: 'Actores', path: 'actors' },
      { icon: Activity, label: 'Procesos', path: 'processes' },
      { icon: FileText, label: 'Recolección', path: 'collection' },
    ],
  },
  {
    section: 'DISEÑO',
    items: [
      { icon: Settings, label: 'Requerimientos', path: 'requirements' },
      { icon: PenTool, label: 'Diagramas UML', path: 'uml' },
    ],
  },
  {
    section: 'EXPORTAR',
    items: [
      { icon: Download, label: 'Master Prompt', path: 'export' },
      { icon: Box, label: 'Demo Builder', path: 'demo' },
      { icon: Globe, label: 'GitHub', path: 'github' },
    ],
  },
]

export default function ProjectWorkspace() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeUsers, setActiveUsers] = useState(1)

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    if (!user || !projectId) return
    const channel = supabase.channel(`presence:${projectId}`, {
      config: { presence: { key: user.id } },
    })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setActiveUsers(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })
    return () => { supabase.removeChannel(channel) }
  }, [projectId, user])

  async function loadProject() {
    try {
      const { data } = await api.get(`/projects/${projectId}`)
      setProject(data)
    } catch {
      toast.error('Proyecto no encontrado')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  function isActive(path) {
    const full = `/projects/${projectId}/${path}`
    if (path === '') return location.pathname === `/projects/${projectId}` || location.pathname === `/projects/${projectId}/`
    return location.pathname.includes(full)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%', margin: '-1.5rem' }}>
      {/* Project Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          flexShrink: 0,
          height: '100vh',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ width: 220, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minHeight: '100%' }}>
          {/* Project name */}
          <div style={{ padding: '0.75rem 0.5rem', marginBottom: '0.5rem' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem', paddingLeft: 0 }}>
              <ChevronLeft size={15} /> Dashboard
            </button>
            <h2 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
              {project?.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="active-dot" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUsers} activo{activeUsers !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <hr className="divider" />

          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div className="sidebar-section">{section}</div>
              {items.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(`/projects/${projectId}/${path}`)}
                  className={`sidebar-item ${isActive(path) ? 'active' : ''}`}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem' }}>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Workspace topbar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(15, 15, 26, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <button onClick={() => setSidebarOpen(p => !p)} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
            <ChevronRight size={18} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
          </button>
          <div style={{ height: 20, width: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {project?.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
            <span className="active-dot" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeUsers} usuario{activeUsers !== 1 ? 's' : ''} activo{activeUsers !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Page */}
        <div style={{ padding: '1.5rem' }}>
          <Routes>
            <Route index element={<Overview project={project} onRefresh={loadProject} />} />
            <Route path="team" element={<Team project={project} />} />
            <Route path="audit" element={<AuditLog projectId={projectId} />} />
            <Route path="stakeholders" element={<Stakeholders projectId={projectId} />} />
            <Route path="actors" element={<Actors projectId={projectId} />} />
            <Route path="processes" element={<Processes projectId={projectId} />} />
            <Route path="collection" element={<Collection projectId={projectId} />} />
            <Route path="requirements" element={<Requirements projectId={projectId} />} />
            <Route path="uml" element={<UMLDiagrams projectId={projectId} />} />
            <Route path="export" element={<ExportPage project={project} />} />
            <Route path="demo" element={<DemoBuilder project={project} />} />
            <Route path="github" element={<GitHub project={project} onRefresh={loadProject} />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
