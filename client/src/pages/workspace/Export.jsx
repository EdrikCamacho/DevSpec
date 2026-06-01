import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, FileArchive, Clipboard, Check, Sparkles } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Export({ project }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (project?.id) {
      loadMasterPrompt()
    }
  }, [project])

  async function loadMasterPrompt() {
    try {
      const { data } = await api.get(`/export/${project.id}/master-prompt`)
      setPrompt(data.content || '')
    } catch {
      toast.error('Error al cargar master prompt')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    toast.success('Master Prompt copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadMd() {
    window.open(`${api.defaults.baseURL}/export/${project.id}/master-prompt/download`, '_blank')
  }

  function handleDownloadZip() {
    window.open(`${api.defaults.baseURL}/export/${project.id}/zip`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-100">Exportar Especificación</h2>
        <p className="text-sm text-slate-400">Exporta toda la información recopilada en formato master prompt para IA, archivo Markdown o comprimido ZIP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Export Options */}
        <div className="flex flex-col gap-6 h-fit">
          <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Download size={16} className="text-purple-400" /> Opciones de descarga
            </h3>

            <button
              onClick={handleDownloadMd}
              className="btn btn-secondary flex items-center justify-between gap-3 text-left w-full p-4 border border-slate-800/80 hover:border-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-purple-400" size={20} />
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Documento Markdown</span>
                  <span className="text-[10px] text-slate-400">Descargar como archivo .md</span>
                </div>
              </div>
              <Download size={15} className="text-slate-400" />
            </button>

            <button
              onClick={handleDownloadZip}
              className="btn btn-secondary flex items-center justify-between gap-3 text-left w-full p-4 border border-slate-800/80 hover:border-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <FileArchive className="text-purple-400" size={20} />
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Exportación Completa</span>
                  <span className="text-[10px] text-slate-400">Descargar ZIP con CSV, Markdown y diagramas</span>
                </div>
              </div>
              <Download size={15} className="text-slate-400" />
            </button>
          </div>

          <div className="card p-6 bg-purple-950/10 border border-purple-800/40 rounded-2xl">
            <h4 className="font-semibold text-purple-300 mb-2 text-xs flex items-center gap-1">
              <Sparkles size={13} /> ¿Qué es el Master Prompt?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Es una estructuración consolidada de stakeholders, actores, procesos de negocio, requerimientos funcionales, no funcionales y diagramas UML. 
              Está especialmente optimizado para ser copiado e introducido en IAs generativas (como GPT-4, Claude, Gemini) para instruir la generación de código y arquitectura completa de tu software.
            </p>
          </div>
        </div>

        {/* Right Column: Preview Box */}
        <div className="lg:col-span-2 card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
            <h3 className="font-semibold text-slate-200 text-sm">Vista Previa del Master Prompt</h3>
            <button
              onClick={handleCopy}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs py-1"
              disabled={loading}
            >
              {copied ? <Check size={13} /> : <Clipboard size={13} />} {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner w-8 h-8 border-t-purple-400" />
            </div>
          ) : (
            <textarea
              readOnly
              className="input font-mono text-xs w-full rounded-xl bg-slate-950/20 border border-slate-900 p-4 h-[400px] outline-none resize-none"
              value={prompt}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
