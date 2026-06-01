import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, GitCommit, AlertCircle, PlusCircle, CheckCircle2, ShieldCheck, Globe, Link2, HelpCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function GitHub({ project, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [commits, setCommits] = useState([])
  const [branches, setBranches] = useState([])
  const [requirements, setRequirements] = useState([])
  
  // Connection states
  const [repoUrl, setRepoUrl] = useState(project?.github_repo || '')
  const [accessToken, setAccessToken] = useState('')
  const [connecting, setConnecting] = useState(false)

  // Issue creation states
  const [selectedReq, setSelectedReq] = useState('')
  const [creatingIssue, setCreatingIssue] = useState(false)

  useEffect(() => {
    if (project?.github_repo) {
      loadGitHubData()
    }
  }, [project])

  async function loadGitHubData() {
    setLoading(true)
    try {
      const [commitsRes, branchesRes, reqsRes] = await Promise.all([
        api.get(`/github/${project.id}/commits`),
        api.get(`/github/${project.id}/branches`),
        api.get(`/requirements/${project.id}`),
      ])
      setCommits(commitsRes.data || [])
      setBranches(branchesRes.data || [])
      setRequirements(reqsRes.data.filter(r => r.status !== 'completado') || [])
    } catch (e) {
      console.error('Error al cargar datos de GitHub', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(e) {
    e.preventDefault()
    if (!repoUrl || !accessToken) {
      toast.error('La URL del repositorio y el Token de Acceso son obligatorios')
      return
    }
    setConnecting(true)
    try {
      await api.post('/github/connect', {
        projectId: project.id,
        repoUrl,
        accessToken,
      })
      toast.success('Repositorio de GitHub conectado')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al conectar repositorio')
    } finally {
      setConnecting(false)
    }
  }

  async function handleCreateIssue(e) {
    e.preventDefault()
    if (!selectedReq) return
    
    const req = requirements.find(r => r.id === selectedReq)
    if (!req) return

    setCreatingIssue(true)
    try {
      const { data } = await api.post(`/github/${project.id}/issues`, {
        requirementId: req.id,
        title: `[REQ] ${req.title}`,
        body: `${req.description || 'Sin descripción'}\n\n---\n*Generado automáticamente desde DevSpec Pro*`,
        labels: ['devspec-pro', req.priority, req.type],
      })
      toast.success(`Issue de GitHub creada con éxito (#${data.number})`)
      setSelectedReq('')
    } catch {
      toast.error('Error al crear issue en GitHub')
    } finally {
      setCreatingIssue(false)
    }
  }

  if (!project?.github_repo) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto py-6">
        <div className="card p-8 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
          <div className="text-center mb-6">
            <Globe className="w-12 h-12 mx-auto text-purple-400 mb-3" />
            <h2 className="text-xl font-bold text-slate-100">Conectar repositorio GitHub</h2>
            <p className="text-sm text-slate-400 mt-1">Sincroniza tus commits, ramas e issues directamente con este proyecto</p>
          </div>

          <form onSubmit={handleConnect} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">URL del Repositorio</label>
              <input
                type="url"
                className="input"
                placeholder="https://github.com/usuario/repositorio"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Personal Access Token (PAT) de GitHub</label>
              <input
                type="password"
                className="input"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Se requiere un Token de GitHub con permisos de <code>repo</code> para leer commits, ramas y crear issues.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary justify-center mt-3 flex items-center gap-1.5"
              disabled={connecting}
            >
              {connecting ? (
                <div className="spinner w-4 h-4 border-t-white" />
              ) : (
                <>
                  <Link2 size={16} /> Conectar Repositorio
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-100">Integración GitHub</h2>
        <p className="text-sm text-slate-400">Administra y monitoriza la actividad de desarrollo desde la plataforma</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Repo Info & Issue creator */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-400" /> Repositorio Conectado
            </h3>
            <div className="text-xs text-slate-300 bg-slate-800/20 p-3 rounded-xl border border-slate-800/50 truncate">
              {project.github_repo}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              La conexión está establecida correctamente. Puedes usar la cuenta sincronizada para publicar requerimientos como issues.
            </p>
          </div>

          <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <PlusCircle size={16} className="text-purple-400" /> Crear Issue en GitHub
            </h3>
            <p className="text-xs text-slate-400">
              Publica un requerimiento pendiente en el repositorio de GitHub para que el equipo comience a trabajar.
            </p>

            <form onSubmit={handleCreateIssue} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="label">Requerimiento</label>
                <select
                  value={selectedReq}
                  onChange={e => setSelectedReq(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Selecciona un requerimiento...</option>
                  {requirements.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.priority.toUpperCase()}] {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary justify-center flex items-center gap-1.5"
                disabled={creatingIssue || !selectedReq}
              >
                {creatingIssue ? (
                  <div className="spinner w-4 h-4 border-t-white" />
                ) : (
                  <>
                    <PlusCircle size={15} /> Exportar como Issue
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Commits & Branches */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branches Card */}
            <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl md:col-span-1">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <GitBranch size={16} className="text-purple-400" /> Ramas
              </h3>
              {loading ? (
                <div className="flex justify-center py-6"><div className="spinner w-5 h-5 border-t-purple-400" /></div>
              ) : branches.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">Sin ramas encontradas</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                  {branches.map(b => (
                    <div key={b.name} className="flex items-center gap-2 p-2 bg-slate-800/20 border border-slate-800/50 rounded-lg text-xs text-slate-300 truncate">
                      <GitBranch size={12} className="text-slate-500" />
                      <span>{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commits Card */}
            <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <GitCommit size={16} className="text-purple-400" /> Commits Recientes
              </h3>
              {loading ? (
                <div className="flex justify-center py-10"><div className="spinner w-6 h-6 border-t-purple-400" /></div>
              ) : commits.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-10">Sin commits cargados.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto">
                  {commits.map(c => (
                    <div key={c.sha} className="flex flex-col gap-1 p-3 bg-slate-800/10 border border-slate-800/40 rounded-xl">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-xs text-slate-200 line-clamp-1">{c.message}</span>
                        <span className="font-mono text-[9px] text-purple-400 bg-purple-950/20 px-1.5 py-0.5 rounded">{c.sha.slice(0, 7)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>Autor: {c.author}</span>
                        <span>{new Date(c.date).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
