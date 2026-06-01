import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { History, Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function AuditLog({ projectId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

  useEffect(() => {
    if (projectId) {
      loadLogs()
    }
  }, [projectId, page])

  async function loadLogs() {
    setLoading(true)
    try {
      const { data } = await api.get(`/audit/${projectId}`, {
        params: { page, limit },
      })
      setLogs(data.data || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  function getActionBadgeClass(action) {
    if (action.includes('created')) return 'badge-green'
    if (action.includes('updated')) return 'badge-yellow'
    if (action.includes('deleted')) return 'badge-red'
    return 'badge-blue'
  }

  function formatAction(action) {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-100">Historial de Auditoría</h2>
        <p className="text-sm text-slate-400">Bitácora de cambios y actividades del proyecto en tiempo real</p>
      </div>

      <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
        <h3 className="text-md font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <History size={18} className="text-purple-400" /> Registro de Actividad
        </h3>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner w-8 h-8 border-t-purple-400" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-10">
            No hay registros de actividad para este proyecto.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Detalles</th>
                    <th>Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {log.users?.avatar_url ? (
                            <img src={log.users.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                              {log.users?.full_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="font-medium text-slate-200 text-xs">{log.users?.full_name || 'Sistema'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadgeClass(log.action)} text-[10px] px-2 py-0.5`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="max-w-xs truncate text-xs text-slate-400">
                        {log.details ? JSON.stringify(log.details) : 'N/A'}
                      </td>
                      <td className="text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString('es-ES')}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/60">
              <span className="text-xs text-slate-400">
                Página {page} de {totalPages} ({total} registros en total)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                >
                  Siguiente <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
