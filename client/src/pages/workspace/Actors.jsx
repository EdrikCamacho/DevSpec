import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Plus, Edit2, Trash2, Save, X, Bot } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Actors({ projectId }) {
  const [actors, setActors] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', type: 'humano', description: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchActors()
    }
  }, [projectId])

  async function fetchActors() {
    try {
      const { data } = await api.get(`/actors/${projectId}`)
      setActors(data)
    } catch {
      toast.error('Error al cargar actores')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name) return
    try {
      if (editingId) {
        await api.patch(`/actors/${projectId}/${editingId}`, formData)
        toast.success('Actor actualizado')
      } else {
        await api.post(`/actors/${projectId}`, formData)
        toast.success('Actor creado')
      }
      setFormData({ name: '', type: 'humano', description: '' })
      setEditingId(null)
      setIsAdding(false)
      fetchActors()
    } catch {
      toast.error('Error al guardar actor')
    }
  }

  function handleEdit(actor) {
    setFormData({
      name: actor.name,
      type: actor.type || 'humano',
      description: actor.description || '',
    })
    setEditingId(actor.id)
    setIsAdding(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este actor?')) return
    try {
      await api.delete(`/actors/${projectId}/${id}`)
      toast.success('Actor eliminado')
      fetchActors()
    } catch {
      toast.error('Error al eliminar actor')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Actores del Sistema</h2>
          <p className="text-sm text-slate-400">Describe a los usuarios humanos y sistemas externos que interactúan con tu software</p>
        </div>
        {!isAdding && (
          <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', type: 'humano', description: '' }) }} className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={15} /> Agregar Actor
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Editar Actor' : 'Nuevo Actor'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Nombre del Actor</label>
              <input type="text" className="input" placeholder="Ej. Administrador, Pasarela de Pago" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Tipo de Actor</label>
              <select className="input" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
                <option value="humano">Usuario Humano</option>
                <option value="sistema_externo">Sistema Externo / API</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea className="input" placeholder="Permisos, responsabilidades, y contexto del actor..." value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary btn-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Save size={14} /> {editingId ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-t-purple-400" /></div>
      ) : actors.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800/80">
          <Cpu className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Sin actores registrados</p>
          <p className="text-xs text-slate-500 mt-1">Registra a los actores que interactúan con el sistema para estructurar los casos de uso.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actors.map(a => (
            <div key={a.id} className="card p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-200 text-sm truncate">{a.name}</h4>
                  <span className={`badge ${a.type === 'humano' ? 'badge-blue' : 'badge-purple'} text-[9px] py-0.5 px-1.5`}>
                    {a.type === 'humano' ? 'Humano' : 'Sistema Externo'}
                  </span>
                </div>
                {a.description && <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded border border-slate-800/40">{a.description}</p>}
              </div>

              <div className="flex flex-col gap-1.5 justify-start">
                <button onClick={() => handleEdit(a)} className="btn btn-ghost btn-sm p-1.5 hover:text-purple-400 border-0"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(a.id)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400 border-0"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
