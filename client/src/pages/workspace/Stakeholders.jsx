import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Plus, Edit2, Trash2, Save, X, ShieldAlert } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Stakeholders({ projectId }) {
  const [stakeholders, setStakeholders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', role: '', influence: 'media', notes: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchStakeholders()
    }
  }, [projectId])

  async function fetchStakeholders() {
    try {
      const { data } = await api.get(`/stakeholders/${projectId}`)
      setStakeholders(data)
    } catch {
      toast.error('Error al cargar stakeholders')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name) return
    try {
      if (editingId) {
        await api.patch(`/stakeholders/${projectId}/${editingId}`, formData)
        toast.success('Stakeholder actualizado')
      } else {
        await api.post(`/stakeholders/${projectId}`, formData)
        toast.success('Stakeholder creado')
      }
      setFormData({ name: '', role: '', influence: 'media', notes: '' })
      setEditingId(null)
      setIsAdding(false)
      fetchStakeholders()
    } catch {
      toast.error('Error al guardar stakeholder')
    }
  }

  function handleEdit(stakeholder) {
    setFormData({
      name: stakeholder.name,
      role: stakeholder.role || '',
      influence: stakeholder.influence || 'media',
      notes: stakeholder.notes || '',
    })
    setEditingId(stakeholder.id)
    setIsAdding(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este stakeholder?')) return
    try {
      await api.delete(`/stakeholders/${projectId}/${id}`)
      toast.success('Stakeholder eliminado')
      fetchStakeholders()
    } catch {
      toast.error('Error al eliminar stakeholder')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Stakeholders</h2>
          <p className="text-sm text-slate-400">Identifica y gestiona las partes interesadas del proyecto y su nivel de influencia</p>
        </div>
        {!isAdding && (
          <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', role: '', influence: 'media', notes: '' }) }} className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={15} /> Agregar Stakeholder
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Editar Stakeholder' : 'Nuevo Stakeholder'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Nombre</label>
              <input type="text" className="input" placeholder="Nombre completo o cargo" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Rol / Función</label>
              <input type="text" className="input" placeholder="Ej. Cliente Principal, Sponsor" value={formData.role} onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Nivel de Influencia</label>
              <select className="input" value={formData.influence} onChange={e => setFormData(prev => ({ ...prev, influence: e.target.value }))}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Notas adicionales</label>
            <textarea className="input" placeholder="Expectativas, preocupaciones, requerimientos clave..." value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary btn-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Save size={14} /> {editingId ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-t-purple-400" /></div>
      ) : stakeholders.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800/80">
          <User className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Sin stakeholders registrados</p>
          <p className="text-xs text-slate-500 mt-1">Registra a las personas interesadas para organizar mejor los requerimientos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakeholders.map(s => (
            <div key={s.id} className="card p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-200 text-sm truncate">{s.name}</h4>
                  <span className={`badge ${s.influence === 'alta' ? 'badge-red' : s.influence === 'media' ? 'badge-yellow' : 'badge-green'} text-[9px] py-0.5 px-1.5`}>
                    Influencia {s.influence}
                  </span>
                </div>
                {s.role && <p className="text-xs text-purple-400 font-medium mb-2">{s.role}</p>}
                {s.notes && <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded border border-slate-800/40">{s.notes}</p>}
              </div>

              <div className="flex flex-col gap-1.5 justify-start">
                <button onClick={() => handleEdit(s)} className="btn btn-ghost btn-sm p-1.5 hover:text-purple-400 border-0"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400 border-0"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
