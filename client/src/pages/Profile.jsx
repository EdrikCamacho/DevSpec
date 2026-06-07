import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { User, Phone, MapPin, Code, GitBranch, Sparkles, Check, Upload, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    github_username: '',
    available: true,
    skills: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        github_username: profile.github_username || '',
        available: profile.available ?? true,
        skills: profile.skills ? profile.skills.join(', ') : '',
      })
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : []

      await api.patch('/users/me', {
        ...formData,
        skills: skillsArray,
      })

      await refreshProfile()
      toast.success('Perfil actualizado correctamente')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`

      // Upload to supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update in DB
      await api.patch('/users/me', { avatar_url: publicUrl })
      await refreshProfile()
      toast.success('Avatar actualizado')
    } catch (err) {
      toast.error('Error al subir el avatar')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto py-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mi Perfil</h1>
          <p className="text-sm text-slate-400">Gestiona tu información personal, habilidades e integraciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card: Avatar & Stats */}
        <div className="card flex flex-col items-center text-center p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl h-fit">
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500/40 group-hover:border-purple-400 transition-colors flex items-center justify-center bg-slate-800">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-purple-400">{profile?.full_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? (
                <div className="spinner w-5 h-5 border-t-purple-400" />
              ) : (
                <Upload className="w-5 h-5 text-white" />
              )}
              <input type="file" onChange={handleAvatarUpload} accept="image/*" className="hidden" disabled={uploading} />
            </label>
          </div>

          <h2 className="text-lg font-semibold text-slate-100 mt-4">{profile?.full_name || 'Usuario'}</h2>
          <p className="text-sm text-slate-400">{profile?.email}</p>

          <div className="mt-6 w-full pt-6 border-t border-slate-800/80 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Disponibilidad</span>
              <span className={`badge ${formData.available ? 'badge-green' : 'badge-red'}`}>
                {formData.available ? 'Disponible' : 'Ocupado'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Miembro desde</span>
              <span className="text-slate-300">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Profile Form */}
        <div className="md:col-span-2 card p-8 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-group">
                <label className="label">Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={formData.full_name}
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Ingresa tu nombre"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Teléfono</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ingresa tu teléfono"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Ciudad</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ej. Madrid, CDMX"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Usuario GitHub</label>
                <div style={{ position: 'relative' }}>
                  <GitBranch size={15} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={formData.github_username}
                    onChange={e => setFormData(prev => ({ ...prev, github_username: e.target.value }))}
                    placeholder="Usuario de GitHub"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Habilidades (Separadas por comas)</label>
                <div style={{ position: 'relative' }}>
                  <Code size={15} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    value={formData.skills}
                    onChange={e => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="React, Express, PostgreSQL, Figma, UI Design"
                  />
                </div>
              <p className="text-xs text-slate-500 mt-1">Ingresa tus aptitudes técnicas separadas por comas para que tu equipo pueda verlas.</p>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/20 p-4 rounded-xl border border-slate-800/40">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={e => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                className="w-4 h-4 accent-purple-500 rounded border-slate-700 bg-slate-900 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <label htmlFor="available" className="text-sm text-slate-300 font-medium cursor-pointer select-none">
                Estoy disponible para participar en proyectos y colaborar
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="submit"
                className="btn btn-primary px-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4 border-t-white" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
