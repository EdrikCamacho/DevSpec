import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();

router.get('/:projectId', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('requirements')
    .select('*')
    .eq('project_id', req.params.projectId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:projectId', requireAuth, async (req, res) => {
  const { title, description, priority, type, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const { data, error } = await supabaseAdmin
    .from('requirements')
    .insert({ project_id: req.params.projectId, title, description, priority: priority || 'media', type: type || 'funcional', status: status || 'pendiente' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'requirement_created', { title });
  res.status(201).json(data);
});

router.patch('/:projectId/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('requirements')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('project_id', req.params.projectId)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'requirement_updated', req.body);
  res.json(data);
});

router.delete('/:projectId/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('requirements')
    .delete()
    .eq('id', req.params.id)
    .eq('project_id', req.params.projectId);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'requirement_deleted', { id: req.params.id });
  res.json({ message: 'Deleted' });
});

export default router;
