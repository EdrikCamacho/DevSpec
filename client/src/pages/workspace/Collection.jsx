import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Collection({ projectId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    activity: 'entrevista',
    date: '',
    status: 'pendiente',
    notes: '',
  })

  useEffect(() => {
    if (projectId) {
      fetchActivities()
    }
  }, [projectId])

  async function fetchActivities() {
    try {
      const { data } = await api.get(`/collection/${projectId}`)
      setActivities(data)
    } catch {
      toast.error('Error al cargar actividades')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.activity) return
    try {
      if (editingId) {
        await api.patch(`/collection/${projectId}/${editingId}`, formData)
        toast.success('Actividad actualizada')
      } else {
        await api.post(`/collection/${projectId}`, formData)
        toast.success('Actividad creada')
      }
      resetForm()
      fetchActivities()
    } catch {
      toast.error('Error al guardar actividad')
    }
  }

  function resetForm() {
    setFormData({ activity: 'entrevista', date: '', status: 'pendiente', notes: '' })
    setEditingId(null)
    setIsAdding(false)
  }

  function handleEdit(act) {
    setFormData({
      activity: act.activity,
      date: act.date || '',
      status: act.status || 'pendiente',
      notes: act.notes || '',
    })
    setEditingId(act.id)
    setIsAdding(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return
    try {
      await api.delete(`/collection/${projectId}/${id}`)
      toast.success('Actividad eliminada')
      fetchActivities()
    } catch {
      toast.error('Error al eliminar actividad')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Actividades de Recolección</h2>
          <p className="text-sm text-slate-400">Planifica y documenta tus entrevistas, cuestionarios y talleres de levantamiento de requisitos</p>
        </div>
        {!isAdding && (
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={15} /> Nueva Actividad
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Editar Actividad' : 'Nueva Actividad'}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Tipo de Actividad</label>
              <select className="input" value={formData.activity} onChange={e => setFormData(prev => ({ ...prev, activity: e.target.value }))}>
                <option value="entrevista">Entrevista</option>
                <option value="cuestionario">Cuestionario</option>
                <option value="taller">Taller de Requisitos</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Fecha</label>
              <input type="date" className="input" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} />
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

          <div className="form-group">
            <label className="label">Notas y Minuta</label>
            <textarea className="input" placeholder="Preguntas clave, acuerdos, notas de la sesión..." value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Save size={14} /> {editingId ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-t-purple-400" /></div>
      ) : activities.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800/80">
          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Sin actividades registradas</p>
          <p className="text-xs text-slate-500 mt-1">Comienza planificando una entrevista o taller para recolectar información.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map(act => (
            <div key={act.id} className="card p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-200 text-sm capitalize">{act.activity}</h4>
                  <span className={`badge ${act.status === 'completado' ? 'badge-green' : act.status === 'en_progreso' ? 'badge-yellow' : 'badge-gray'} text-[9px] py-0.5 px-1.5`}>
                    {act.status.replace('_', ' ')}
                  </span>
                </div>
                {act.date && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium mb-3">
                    <Calendar size={13} /> {new Date(act.date).toLocaleDateString('es-ES')}
                  </div>
                )}
                {act.notes && <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded border border-slate-800/40">{act.notes}</p>}
              </div>

              <div className="flex flex-col gap-1.5 justify-start">
                <button onClick={() => handleEdit(act)} className="btn btn-ghost btn-sm p-1.5 hover:text-purple-400 border-0"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(act.id)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400 border-0"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
