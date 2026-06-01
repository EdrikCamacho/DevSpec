import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Plus, Edit2, Trash2, Save, X, Sparkles, Wand2 } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Requirements({ projectId }) {
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    type: 'funcional',
    status: 'pendiente',
  })

  useEffect(() => {
    if (projectId) {
      fetchRequirements()
    }
  }, [projectId])

  async function fetchRequirements() {
    try {
      const { data } = await api.get(`/requirements/${projectId}`)
      setRequirements(data)
    } catch {
      toast.error('Error al cargar requerimientos')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.title) return
    try {
      if (editingId) {
        await api.patch(`/requirements/${projectId}/${editingId}`, formData)
        toast.success('Requerimiento actualizado')
      } else {
        await api.post(`/requirements/${projectId}`, formData)
        toast.success('Requerimiento creado')
      }
      resetForm()
      fetchRequirements()
    } catch {
      toast.error('Error al guardar requerimiento')
    }
  }

  function resetForm() {
    setFormData({ title: '', description: '', priority: 'media', type: 'funcional', status: 'pendiente' })
    setEditingId(null)
    setIsAdding(false)
  }

  function handleEdit(req) {
    setFormData({
      title: req.title,
      description: req.description || '',
      priority: req.priority || 'media',
      type: req.type || 'funcional',
      status: req.status || 'pendiente',
    })
    setEditingId(req.id)
    setIsAdding(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este requerimiento?')) return
    try {
      await api.delete(`/requirements/${projectId}/${id}`)
      toast.success('Requerimiento eliminado')
      fetchRequirements()
    } catch {
      toast.error('Error al eliminar requerimiento')
    }
  }

  async function handleAISuggestions() {
    setSuggesting(true)
    setSuggestions([])
    try {
      const { data } = await api.post(`/ai/suggest-requirements/${projectId}`)
      setSuggestions(data || [])
      toast.success('Sugerencias generadas por la IA')
    } catch {
      toast.error('Error al generar sugerencias')
    } finally {
      setSuggesting(false)
    }
  }

  async function handleAddSuggestion(sug) {
    try {
      await api.post(`/requirements/${projectId}`, {
        title: sug.title,
        description: sug.description,
        type: sug.type || 'funcional',
        priority: sug.priority || 'media',
        status: 'pendiente',
      })
      toast.success('Sugerencia agregada al proyecto')
      setSuggestions(prev => prev.filter(item => item.title !== sug.title))
      fetchRequirements()
    } catch {
      toast.error('Error al guardar sugerencia')
    }
  }

  const funcReqs = requirements.filter(r => r.type === 'funcional')
  const nonFuncReqs = requirements.filter(r => r.type === 'no_funcional')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Requerimientos de Software</h2>
          <p className="text-sm text-slate-400">Gestiona los requerimientos funcionales y no funcionales del sistema con asistencia de IA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAISuggestions} className="btn btn-secondary btn-sm flex items-center gap-1.5 border border-purple-500/30 text-purple-300 hover:bg-purple-900/10" disabled={suggesting}>
            <Wand2 size={15} /> {suggesting ? 'Pensando...' : 'Sugerir con IA'}
          </button>
          {!isAdding && (
            <button onClick={() => { resetForm(); setIsAdding(true); }} className="btn btn-primary btn-sm flex items-center gap-1">
              <Plus size={15} /> Nuevo Requerimiento
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions Box */}
      {suggestions.length > 0 && (
        <div className="card p-6 bg-purple-950/10 border border-purple-800/40 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
            <Sparkles size={16} /> Requerimientos sugeridos por IA
          </h3>
          <div className="flex flex-col gap-3">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="flex justify-between items-start p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-200 text-xs">{sug.title}</span>
                    <span className="badge badge-purple text-[8px] py-0 px-1 capitalize">{sug.type}</span>
                    <span className={`badge ${sug.priority === 'alta' ? 'badge-red' : sug.priority === 'media' ? 'badge-yellow' : 'badge-green'} text-[8px] py-0 px-1`}>
                      {sug.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{sug.description}</p>
                </div>
                <button onClick={() => handleAddSuggestion(sug)} className="btn btn-primary btn-sm text-xs py-1 px-3">Agregar</button>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={() => setSuggestions([])} className="btn btn-ghost btn-sm text-xs text-slate-400">Descartar todas</button>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Editar Requerimiento' : 'Nuevo Requerimiento'}</h3>
          
          <div className="form-group">
            <label className="label">Título</label>
            <input type="text" className="input" placeholder="Ej. Inicio de sesión OAuth2, Exportación PDF" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea className="input" placeholder="Detalla el alcance y comportamiento esperado del requerimiento..." value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Tipo</label>
              <select className="input" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
                <option value="funcional">Funcional</option>
                <option value="no_funcional">No Funcional</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Prioridad</label>
              <select className="input" value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Estado</label>
              <select className="input" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Save size={14} /> {editingId ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-t-purple-400" /></div>
      ) : requirements.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800/80">
          <Settings className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Sin requerimientos registrados</p>
          <p className="text-xs text-slate-500 mt-1">Registra requerimientos o haz clic en "Sugerir con IA" para automatizar la especificación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Functional Requirements */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 pb-2 border-b border-slate-800">Requerimientos Funcionales ({funcReqs.length})</h3>
            {funcReqs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay requerimientos funcionales creados.</p>
            ) : (
              funcReqs.map(r => (
                <RequirementCard key={r.id} req={r} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </div>

          {/* Non-Functional Requirements */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 pb-2 border-b border-slate-800">Requerimientos No Funcionales ({nonFuncReqs.length})</h3>
            {nonFuncReqs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay requerimientos no funcionales creados.</p>
            ) : (
              nonFuncReqs.map(r => (
                <RequirementCard key={r.id} req={r} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function RequirementCard({ req, onEdit, onDelete }) {
  return (
    <div className="card p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-semibold text-slate-200 text-sm">{req.title}</h4>
          <span className={`badge ${req.priority === 'alta' ? 'badge-red' : req.priority === 'media' ? 'badge-yellow' : 'badge-green'} text-[8px] py-0 px-1.5`}>
            {req.priority}
          </span>
          <span className={`badge ${req.status === 'completado' ? 'badge-green' : req.status === 'en_progreso' ? 'badge-yellow' : 'badge-gray'} text-[8px] py-0 px-1.5`}>
            {req.status}
          </span>
        </div>
        {req.description && <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/10 p-2.5 rounded border border-slate-800/40">{req.description}</p>}
      </div>

      <div className="flex flex-col gap-1.5 justify-start">
        <button onClick={() => onEdit(req)} className="btn btn-ghost btn-sm p-1.5 hover:text-purple-400 border-0"><Edit2 size={13} /></button>
        <button onClick={() => onDelete(req.id)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400 border-0"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}
