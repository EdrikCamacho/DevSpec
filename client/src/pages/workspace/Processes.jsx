import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Processes({ projectId }) {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    inputs: '',
    outputs: '',
    use_cases: '',
  })

  useEffect(() => {
    if (projectId) {
      fetchProcesses()
    }
  }, [projectId])

  async function fetchProcesses() {
    try {
      const { data } = await api.get(`/processes/${projectId}`)
      setProcesses(data)
    } catch {
      toast.error('Error al cargar procesos')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name) return
    try {
      if (editingId) {
        await api.patch(`/processes/${projectId}/${editingId}`, formData)
        toast.success('Proceso actualizado')
      } else {
        await api.post(`/processes/${projectId}`, formData)
        toast.success('Proceso creado')
      }
      resetForm()
      fetchProcesses()
    } catch {
      toast.error('Error al guardar proceso')
    }
  }

  function resetForm() {
    setFormData({ name: '', objective: '', inputs: '', outputs: '', use_cases: '' })
    setEditingId(null)
    setIsAdding(false)
  }

  function handleEdit(process) {
    setFormData({
      name: process.name,
      objective: process.objective || '',
      inputs: process.inputs || '',
      outputs: process.outputs || '',
      use_cases: process.use_cases || '',
    })
    setEditingId(process.id)
    setIsAdding(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este proceso?')) return
    try {
      await api.delete(`/processes/${projectId}/${id}`)
      toast.success('Proceso eliminado')
      fetchProcesses()
    } catch {
      toast.error('Error al eliminar proceso')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Procesos de Negocio</h2>
          <p className="text-sm text-slate-400">Describe los flujos de trabajo principales, entradas y salidas del sistema</p>
        </div>
        {!isAdding && (
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={15} /> Agregar Proceso
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Editar Proceso' : 'Nuevo Proceso'}</h3>
          
          <div className="form-group">
            <label className="label">Nombre del Proceso</label>
            <input type="text" className="input" placeholder="Ej. Procesar compra, Registro de usuario" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="label">Objetivo</label>
            <textarea className="input" placeholder="¿Cuál es el fin último de este proceso?" value={formData.objective} onChange={e => setFormData(prev => ({ ...prev, objective: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Entradas (Inputs)</label>
              <input type="text" className="input" placeholder="Datos de entrada, archivos, credenciales..." value={formData.inputs} onChange={e => setFormData(prev => ({ ...prev, inputs: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Salidas (Outputs)</label>
              <input type="text" className="input" placeholder="Confirmaciones de correo, tokens de sesión..." value={formData.outputs} onChange={e => setFormData(prev => ({ ...prev, outputs: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Casos de Uso relacionados</label>
            <input type="text" className="input" placeholder="Ej. CU-01 Comprar, CU-02 Cancelar" value={formData.use_cases} onChange={e => setFormData(prev => ({ ...prev, use_cases: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Save size={14} /> {editingId ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-t-purple-400" /></div>
      ) : processes.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800/80">
          <Activity className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Sin procesos registrados</p>
          <p className="text-xs text-slate-500 mt-1">Registra los flujos del sistema para comprender mejor los requerimientos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {processes.map(p => (
            <div key={p.id} className="card p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1 flex flex-col gap-3">
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{p.name}</h4>
                  {p.objective && <p className="text-xs text-slate-400 mt-1">{p.objective}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/20 p-3 rounded-xl border border-slate-800/40">
                  <div>
                    <span className="font-medium text-purple-400">Entradas:</span> <span className="text-slate-300">{p.inputs || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-400">Salidas:</span> <span className="text-slate-300">{p.outputs || 'N/A'}</span>
                  </div>
                  {p.use_cases && (
                    <div className="sm:col-span-2 mt-1">
                      <span className="font-medium text-purple-400">Casos de Uso:</span> <span className="text-slate-300">{p.use_cases}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5">
                <button onClick={() => handleEdit(p)} className="btn btn-ghost btn-sm p-1.5 hover:text-purple-400 border-0"><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400 border-0"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
