import { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, Sparkles, Code, Play, Check, Copy } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function DemoBuilder({ project }) {
  const [description, setDescription] = useState('')
  const [html, setHtml] = useState('')
  const [generating, setGenerating] = useState(false)
  const [viewMode, setViewMode] = useState('preview') // 'preview' | 'code'
  const [copied, setCopied] = useState(false)

  async function handleBuild(e) {
    e.preventDefault()
    if (!description) return
    setGenerating(true)
    try {
      const { data } = await api.post(`/ai/demo-builder/${project.id}`, {
        screenDescription: description,
      })
      setHtml(data.html || '')
      toast.success('Prototipo interactivo generado con éxito')
      setViewMode('preview')
    } catch {
      toast.error('Error al generar prototipo')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(html)
    setCopied(true)
    toast.success('Código copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-100">Demo Builder</h2>
        <p className="text-sm text-slate-400">Genera pantallas y prototipos interactivos funcionales usando IA en segundos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Input */}
        <div className="flex flex-col gap-6 h-fit">
          <form onSubmit={handleBuild} className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Box size={16} className="text-purple-400" /> Generador de Pantallas
            </h3>

            <div className="form-group">
              <label className="label">Descripción de la Pantalla</label>
              <textarea
                className="input"
                style={{ minHeight: 120 }}
                placeholder="Ej. Una pantalla de login moderna con fondo animado, campos de correo y contraseña, y botón de inicio de sesión con redes sociales..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center flex items-center gap-1.5"
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="spinner w-4 h-4 border-t-white" /> Generando prototipo...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Generar Demo
                </>
              )}
            </button>
          </form>

          <div className="card p-6 bg-purple-950/10 border border-purple-800/40 rounded-2xl">
            <h4 className="font-semibold text-purple-300 mb-2 text-xs">💡 Recomendaciones</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sé específico con los componentes interactivos que deseas (modales, carruseles, tablas editables). El prototipo se genera utilizando HTML5, TailwindCSS y JavaScript nativo en un solo archivo autocontenido.
            </p>
          </div>
        </div>

        {/* Right Column: Visualization Box */}
        <div className="lg:col-span-2 card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4 min-h-[450px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/60 flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={!html}
              >
                <Play size={13} /> Vista Previa
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`btn btn-sm ${viewMode === 'code' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={!html}
              >
                <Code size={13} /> Código
              </button>
            </div>
            {html && viewMode === 'code' && (
              <button onClick={handleCopy} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs py-1">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-xl bg-slate-950/20 border border-slate-900 overflow-hidden relative min-h-[300px]">
            {generating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm z-10 gap-3">
                <div className="spinner w-8 h-8 border-t-purple-400" />
                <span className="text-xs text-purple-300 font-semibold animate-pulse">La IA está diseñando tu interfaz...</span>
              </div>
            ) : null}

            {!html ? (
              <div className="w-full h-full flex flex-col justify-center items-center p-12 text-slate-500 text-center min-h-[300px]">
                <Box className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">Sin demo generada</p>
                <p className="text-xs text-slate-500 mt-1">Escribe una descripción a la izquierda y presiona "Generar Demo".</p>
              </div>
            ) : viewMode === 'preview' ? (
              <iframe
                title="AI Prototype View"
                srcDoc={html}
                sandbox="allow-scripts"
                className="w-full h-full border-0 bg-white"
                style={{ minHeight: '380px' }}
              />
            ) : (
              <textarea
                readOnly
                className="w-full h-full bg-slate-950/50 p-4 font-mono text-xs text-slate-300 border-0 outline-none resize-none"
                style={{ minHeight: '380px' }}
                value={html}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
