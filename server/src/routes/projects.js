import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit, createNotification } from '../utils/helpers.js';

const router = Router();

// GET /api/projects — list my projects + collaborating
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Owned projects
    const { data: owned, error: e1 } = await supabaseAdmin
      .from('projects')
      .select('*, users!projects_owner_id_fkey(full_name, avatar_url)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (e1) throw e1;

    // Collaborating projects
    const { data: memberRows, error: e2 } = await supabaseAdmin
      .from('project_members')
      .select('role, projects(*, users!projects_owner_id_fkey(full_name, avatar_url))')
      .eq('user_id', userId);

    if (e2) throw e2;

    const collaborating = memberRows
      .filter(m => m.projects)
      .map(m => ({ ...m.projects, member_role: m.role }));

    res.json({ owned, collaborating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — single project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*, users!projects_owner_id_fkey(id, full_name, avatar_url, email)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/projects — create project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, priority, visibility } = req.body;

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        name,
        description,
        priority: priority || 'media',
        visibility: visibility || 'private',
        owner_id: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(data.id, req.user.id, 'project_created', { name });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id — update project
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, priority, visibility, github_repo, progress } = req.body;

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ name, description, priority, visibility, github_repo, progress, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req.params.id, req.user.id, 'project_updated', req.body);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — delete project (with name confirmation)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { confirmName } = req.body;

    // Get project first
    const { data: project, error: fetchErr } = await supabaseAdmin
      .from('projects')
      .select('name, owner_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr) throw fetchErr;

    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can delete this project' });
    }

    if (confirmName !== project.name) {
      return res.status(400).json({ error: 'Project name confirmation does not match' });
    }

    // Log before deletion
    await logAudit(req.params.id, req.user.id, 'project_deleted', { name: project.name });

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/stats — dashboard stats for a project
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const [req1, req2, req3, req4, req5] = await Promise.all([
      supabaseAdmin.from('stakeholders').select('id', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('actors').select('id', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('requirements').select('id, priority, status').eq('project_id', id),
      supabaseAdmin.from('uml_diagrams').select('id', { count: 'exact', head: true }).eq('project_id', id),
      supabaseAdmin.from('collection_activities').select('id, status').eq('project_id', id),
    ]);

    const requirements = req3.data || [];
    const activities = req5.data || [];

    res.json({
      stakeholders: req1.count,
      actors: req2.count,
      requirements: requirements.length,
      uml_diagrams: req4.count,
      requirements_by_priority: {
        alta: requirements.filter(r => r.priority === 'alta').length,
        media: requirements.filter(r => r.priority === 'media').length,
        baja: requirements.filter(r => r.priority === 'baja').length,
      },
      requirements_by_type: {
        funcional: requirements.filter(r => r.type === 'funcional').length,
        no_funcional: requirements.filter(r => r.type === 'no_funcional').length,
      },
      activities_by_status: {
        pendiente: activities.filter(a => a.status === 'pendiente').length,
        en_progreso: activities.filter(a => a.status === 'en_progreso').length,
        completado: activities.filter(a => a.status === 'completado').length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
