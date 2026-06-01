import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { PenTool, Plus, Edit2, Trash2, Save, X, Sparkles, Wand2, Copy, FileCode, Check } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import mermaid from 'mermaid'

// Initialize Mermaid
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      background: '#16162a',
      primaryColor: '#7C3AED',
      primaryTextColor: '#f1f1f5',
      lineColor: '#2a2a45',
    }
  })
} catch (e) {
  console.error('Mermaid init error:', e)
}

export default function UMLDiagrams({ projectId }) {
  const [diagrams, setDiagrams] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeDiagram, setActiveDiagram] = useState(null)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'casos_uso',
    content: '',
  })

  useEffect(() => {
    if (projectId) {
      fetchDiagrams()
    }
  }, [projectId])

  async function fetchDiagrams() {
    try {
      const { data } = await api.get(`/uml/${projectId}`)
      setDiagrams(data)
      if (data.length > 0 && !activeDiagram) {
        setActiveDiagram(data[0])
      }
    } catch {
      toast.error('Error al cargar diagramas')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.title || !formData.content) return
    try {
      let updatedData
      if (editingId) {
        const { data } = await api.patch(`/uml/${projectId}/${editingId}`, formData)
        updatedData = data
        toast.success('Diagrama actualizado')
      } else {
        const { data } = await api.post(`/uml/${projectId}`, formData)
        updatedData = data
        toast.success('Diagrama creado')
      }
      resetForm()
      await fetchDiagrams()
      if (updatedData) {
        setActiveDiagram(updatedData)
      }
    } catch {
      toast.error('Error al guardar diagrama')
    }
  }

  async function handleAIGenerate() {
    if (!formData.title) {
      toast.error('Por favor ingresa un título para el diagrama')
      return
    }
    setGenerating(true)
    try {
      const { data } = await api.post(`/uml/${projectId}/generate`, {
        type: formData.type,
        title: formData.title
      })
      toast.success('Diagrama UML generado con éxito')
      setFormData(prev => ({ ...prev, content: data.content }))
      setActiveDiagram(data)
      fetchDiagrams()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar diagrama UML')
    } finally {
      setGenerating(false)
    }
  }

  function resetForm() {
    setFormData({ title: '', type: 'casos_uso', content: '' })
    setEditingId(null)
    setIsAdding(false)
  }

  function handleEdit(diag) {
    setFormData({
      title: diag.title,
      type: diag.type,
      content: diag.content,
    })
    setEditingId(diag.id)
    setIsAdding(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este diagrama?')) return
    try {
      await api.delete(`/uml/${projectId}/${id}`)
      toast.success('Diagrama eliminado')
      setActiveDiagram(null)
      fetchDiagrams()
    } catch {
      toast.error('Error al eliminar diagrama')
    }
  }

  function handleCopyCode() {
    if (!activeDiagram) return
    navigator.clipboard.writeText(activeDiagram.content)
    setCopied(true)
    toast.success('Código copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Diagramas UML</h2>
          <p className="text-sm text-slate-400">Genera diagramas de secuencia, clases, componentes y casos de uso con asistencia de IA</p>
        </div>
        {!isAdding && (
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={15} /> Nuevo Diagrama
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Editor or List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {isAdding ? (
            <form onSubmit={handleSubmit} className="card p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Editar Diagrama' : 'Nuevo Diagrama'}</h3>
              
              <div className="form-group">
                <label className="label">Título</label>
                <input type="text" className="input" placeholder="Ej. Arquitectura de Clases" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="label">Tipo de Diagrama</label>
                <select className="input" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="casos_uso">Casos de Uso</option>
                  <option value="clases">Diagrama de Clases</option>
                  <option value="secuencia">Diagrama de Secuencia</option>
                  <option value="paquetes">Diagrama de Paquetes</option>
                  <option value="componentes">Arquitectura de Componentes</option>
                </select>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label className="label">Código Mermaid.js</label>
                  <button type="button" onClick={handleAIGenerate} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium mb-1.5" disabled={generating}>
                    <Wand2 size={13} /> {generating ? 'Generando...' : 'Generar código con IA'}
                  </button>
                </div>
                <textarea className="input font-mono text-xs" style={{ minHeight: 200 }} placeholder="graph TD&#10;  A[Cliente] --> B(Servidor)" value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Save size={14} /> {editingId ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          ) : (
            <div className="card p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <PenTool size={18} className="text-purple-400" /> Mis Diagramas
              </h3>

              {loading ? (
                <div className="flex justify-center py-10"><div className="spinner w-5 h-5 border-t-purple-400" /></div>
              ) : diagrams.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No hay diagramas en este proyecto.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {diagrams.map(d => (
                    <div
                      key={d.id}
                      onClick={() => setActiveDiagram(d)}
                      className={`p-3.5 rounded-xl border cursor-pointer flex justify-between items-center gap-3 transition-all ${
                        activeDiagram?.id === d.id
                          ? 'bg-purple-950/20 border-purple-500/40'
                          : 'bg-slate-900/20 border-slate-800/60 hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-200 text-xs truncate">{d.title}</h4>
                        <span className="badge badge-purple text-[8px] py-0 px-1 capitalize mt-1 inline-block">
                          {d.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleEdit(d)} className="p-1 text-slate-400 hover:text-purple-400 border-0 bg-transparent"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(d.id)} className="p-1 text-slate-400 hover:text-red-400 border-0 bg-transparent"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Visualizer */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeDiagram ? (
            <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 h-full">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/60 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">{activeDiagram.title}</h3>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">Tipo: {activeDiagram.type.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyCode} className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1.5">
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado' : 'Copiar Código'}
                  </button>
                </div>
              </div>

              {/* Rendering Mermaid */}
              <div className="mermaid-container flex-1 flex flex-col justify-center items-center rounded-xl bg-slate-950/20 border border-slate-900 p-6 min-h-[300px]">
                <MermaidRenderer key={activeDiagram.id + '-' + activeDiagram.content.length} chart={activeDiagram.content} />
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-slate-500 bg-slate-900/20 border border-slate-800/80 h-full flex flex-col justify-center items-center min-h-[350px]">
              <FileCode className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">Selecciona o crea un diagrama para visualizarlo</p>
              <p className="text-xs text-slate-500 mt-1">Soporta renderizado completo de diagramas de Mermaid.js.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function MermaidRenderer({ chart }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    let active = true
    setError(false)
    setSvg('')

    const renderChart = async () => {
      try {
        const id = `mermaid-svg-${Math.floor(Math.random() * 1000000)}`
        // Ensure chart is cleaned up
        const cleanChart = chart.replace(/%%{.*}%%/g, '').trim()
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart)
        if (active) {
          setSvg(renderedSvg)
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        if (active) {
          setError(true)
        }
        // Reset mermaid internal state if crashed
        try {
          const badElements = document.querySelectorAll('[id^="dmermaid-svg-"], [id^="mermaid-svg-"]')
          badElements.forEach(el => el.remove())
        } catch {}
      }
    }

    renderChart()
    return () => {
      active = false
    }
  }, [chart])

  if (error) {
    return (
      <div className="w-full max-w-lg p-4 rounded-lg border border-red-500/20 bg-red-950/10 text-left text-xs font-mono text-red-400">
        <p className="font-semibold mb-2">Error de sintaxis en Mermaid.js:</p>
        <pre className="overflow-auto max-h-48 whitespace-pre-wrap">{chart}</pre>
      </div>
    )
  }

  if (!svg) {
    return <div className="spinner w-6 h-6 border-t-purple-400" />
  }

  return (
    <div
      ref={elementRef}
      className="w-full flex justify-center overflow-auto max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
