import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Shield, Trash2, Mail, Check } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Team({ project }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('reader')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project?.id) {
      loadMembers()
    }
  }, [project])

  async function loadMembers() {
    try {
      const { data } = await api.get(`/members/${project.id}`)
      setMembers(data)
    } catch (e) {
      toast.error('Error al cargar colaboradores')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      await api.post(`/members/${project.id}/invite`, { email, role })
      toast.success('Invitación enviada y miembro agregado')
      setEmail('')
      loadMembers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al invitar usuario')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.patch(`/members/${project.id}/${userId}`, { role: newRole })
      toast.success('Rol de colaborador actualizado')
      loadMembers()
    } catch {
      toast.error('Error al actualizar rol')
    }
  }

  async function handleRemove(userId) {
    if (!confirm('¿Estás seguro de que deseas remover a este colaborador?')) return
    try {
      await api.delete(`/members/${project.id}/${userId}`)
      toast.success('Colaborador removido')
      loadMembers()
    } catch {
      toast.error('Error al remover colaborador')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-100">Equipo de Trabajo</h2>
        <p className="text-sm text-slate-400">Gestiona los colaboradores y roles de acceso dentro de este proyecto</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Members List */}
        <div className="lg:col-span-2 card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
          <h3 className="text-md font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-400" /> Colaboradores Activos
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="spinner w-6 h-6 border-t-purple-400" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-6">
              Aún no hay colaboradores adicionales en este proyecto.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/20 border border-slate-800/60 rounded-xl gap-4"
                >
                  <div className="flex items-center gap-3">
                    {member.users?.avatar_url ? (
                      <img src={member.users.avatar_url} alt={member.users.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                        {member.users?.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-slate-100 text-sm">{member.users?.full_name}</h4>
                      <p className="text-xs text-slate-400">{member.users?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <Shield size={14} className="text-slate-400" />
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member.user_id, e.target.value)}
                        className="input text-xs py-1 px-2 pr-6 bg-slate-800 border-slate-700/80 rounded"
                        style={{ width: 'fit-content' }}
                      >
                        <option value="reader">Lector</option>
                        <option value="editor">Editor</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemove(member.user_id)}
                      className="btn btn-ghost btn-sm p-1.5 hover:text-red-400 border-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Invite Form */}
        <div className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl h-fit">
          <h3 className="text-md font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-purple-400" /> Invitar Colaborador
          </h3>

          <form onSubmit={handleInvite} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  className="input pl-11"
                  placeholder="colaborador@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">El usuario debe estar registrado en DevSpec Pro.</p>
            </div>

            <div className="form-group">
              <label className="label">Rol en el proyecto</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="input"
              >
                <option value="reader">Lector (Solo ver)</option>
                <option value="editor">Editor (Crear y modificar)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <div className="spinner w-4 h-4 border-t-white" />
              ) : (
                <>
                  <Check size={16} /> Invitar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
