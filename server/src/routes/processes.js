import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();
const TABLE = 'processes';

router.get('/:projectId', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('project_id', req.params.projectId).order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:projectId', requireAuth, async (req, res) => {
  const { name, objective, inputs, outputs, use_cases } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabaseAdmin.from(TABLE).insert({ project_id: req.params.projectId, name, objective, inputs, outputs, use_cases }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'process_created', { name });
  res.status(201).json(data);
});

router.patch('/:projectId/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from(TABLE).update(req.body).eq('id', req.params.id).eq('project_id', req.params.projectId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'process_updated', req.body);
  res.json(data);
});

router.delete('/:projectId/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', req.params.id).eq('project_id', req.params.projectId);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'process_deleted', { id: req.params.id });
  res.json({ message: 'Deleted' });
});

export default router;
