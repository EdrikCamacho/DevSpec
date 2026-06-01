import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, CheckCircle, HelpCircle, UserPlus, Star, Sparkles } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function UserDirectory() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [search, city, available])

  async function fetchUsers() {
    try {
      const { data } = await api.get('/users/directory', {
        params: { search, city, available },
      })
      setUsers(data)
    } catch (e) {
      toast.error('Error al cargar el directorio')
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(userId) {
    try {
      await api.post(`/users/${userId}/connect`)
      toast.success('Petición de conexión enviada')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al conectar')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Directorio de Usuarios</h1>
          <p className="text-sm text-slate-400">Busca colaboradores, conecta con compañeros y forma equipos de desarrollo</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-5 mb-8 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar por nombre, correo, habilidades..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-48">
            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Ciudad..."
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 font-medium select-none cursor-pointer w-full sm:w-auto">
            <input
              type="checkbox"
              checked={available}
              onChange={e => setAvailable(e.target.checked)}
              className="w-4 h-4 accent-purple-500 rounded border-slate-700 bg-slate-900 focus:ring-purple-500 cursor-pointer"
            />
            Solo disponibles
          </label>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner w-8 h-8 border-t-purple-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 bg-slate-900/20 border border-slate-800/80">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <p className="text-base font-semibold text-slate-300">No se encontraron usuarios</p>
          <p className="text-sm mt-1">Prueba a cambiar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-14 h-14 rounded-full object-cover border border-purple-500/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 text-lg">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-100 truncate">{user.full_name || 'Sin Nombre'}</h3>
                    <p className="text-xs text-slate-400 truncate mb-1.5">{user.email}</p>
                    {user.city && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin size={10} /> {user.city}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills tags */}
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {user.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="badge badge-purple text-[10px] py-0.5 px-2">
                        {skill}
                      </span>
                    ))}
                    {user.skills.length > 4 && (
                      <span className="badge badge-gray text-[10px] py-0.5 px-2">
                        +{user.skills.length - 4}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-4">Sin habilidades especificadas</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className={`badge ${user.available ? 'badge-green' : 'badge-red'} text-[10px]`}>
                  {user.available ? 'Disponible' : 'Ocupado'}
                </span>

                <button
                  onClick={() => handleConnect(user.id)}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <UserPlus size={14} /> Conectar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
