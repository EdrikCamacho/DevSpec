import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, Save, Trash2, Calendar, Shield, Users, Tag, GitPullRequest, GitFork, BookOpen, PenTool } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Overview({ project, onRefresh }) {
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [priority, setPriority] = useState(project?.priority || 'media')
  const [visibility, setVisibility] = useState(project?.visibility || 'private')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setPriority(project.priority || 'media')
      setVisibility(project.visibility || 'private')
      loadStats()
    }
  }, [project])

  async function loadStats() {
    try {
      const { data } = await api.get(`/projects/${project.id}/stats`)
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStats(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/projects/${project.id}`, {
        name,
        description,
        priority,
        visibility,
      })
      toast.success('Proyecto actualizado')
      setEditing(false)
      onRefresh()
    } catch (err) {
      toast.error('Error al actualizar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Visión General</h2>
          <p className="text-sm text-slate-400">Progreso del proyecto, estadísticas globales e información del repositorio</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="btn btn-secondary btn-sm"
        >
          {editing ? 'Cancelar edición' : 'Editar Proyecto'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {editing ? (
            <form onSubmit={handleSave} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
              <div className="form-group">
                <label className="label">Nombre del Proyecto</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Descripción</label>
                <textarea
                  className="input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe el objetivo y alcance del proyecto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Prioridad</label>
                  <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Visibilidad</label>
                  <select className="input" value={visibility} onChange={e => setVisibility(e.target.value)}>
                    <option value="private">Privado</option>
                    <option value="public">Público</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4 flex items-center justify-center gap-1.5" disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          ) : (
            <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${project?.priority === 'alta' ? 'badge-red' : project?.priority === 'media' ? 'badge-yellow' : 'badge-green'}`}>
                  Prioridad {project?.priority}
                </span>
                <span className={`badge ${project?.visibility === 'private' ? 'badge-gray' : 'badge-blue'}`}>
                  {project?.visibility === 'private' ? 'Privado' : 'Público'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">{project?.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 whitespace-pre-line">
                {project?.description || 'Sin descripción disponible.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-purple-400" />
                  <span>Creado: {new Date(project?.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-purple-400" />
                  <span>Propietario: {project?.users?.full_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="metric-card">
              <span className="metric-value">{loadingStats ? '-' : stats?.stakeholders}</span>
              <span className="metric-label">Stakeholders</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{loadingStats ? '-' : stats?.actors}</span>
              <span className="metric-label">Actores</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{loadingStats ? '-' : stats?.requirements}</span>
              <span className="metric-label">Requerimientos</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{loadingStats ? '-' : stats?.uml_diagrams}</span>
              <span className="metric-label">Diagramas UML</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Progress & GitHub integration info */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <h4 className="font-semibold text-slate-200 mb-4">Progreso del Proyecto</h4>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-black text-slate-100">{project?.progress}%</span>
              <span className="text-xs text-slate-400">Completado</span>
            </div>
            <div className="progress-bar w-full mb-4">
              <div className="progress-fill" style={{ width: `${project?.progress}%` }} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El progreso se actualiza manualmente o de manera automática al completar las tareas y requerimientos asignados.
            </p>
          </div>

          <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <h4 className="font-semibold text-slate-200 mb-3">Integración GitHub</h4>
            {project?.github_repo ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/40 p-2 rounded border border-slate-700/50">
                  <GitFork size={14} className="text-purple-400" />
                  <span className="truncate">{project.github_repo.replace('https://github.com/', '')}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Repositorio sincronizado. Puedes consultar commits, crear ramas o abrir issues desde el módulo de GitHub.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Conecta este proyecto con un repositorio de GitHub para automatizar el seguimiento de desarrollo y sincronización.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
