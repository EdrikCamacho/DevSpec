import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../utils/helpers.js';

const router = Router();
const TABLE = 'collection_activities';

router.get('/:projectId', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('project_id', req.params.projectId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:projectId', requireAuth, async (req, res) => {
  const { activity, date, status, notes } = req.body;
  if (!activity) return res.status(400).json({ error: 'Activity type is required' });
  const { data, error } = await supabaseAdmin.from(TABLE).insert({ project_id: req.params.projectId, activity, date, status: status || 'pendiente', notes }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'collection_activity_created', { activity });
  res.status(201).json(data);
});

router.patch('/:projectId/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from(TABLE).update(req.body).eq('id', req.params.id).eq('project_id', req.params.projectId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'collection_activity_updated', req.body);
  res.json(data);
});

router.delete('/:projectId/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', req.params.id).eq('project_id', req.params.projectId);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'collection_activity_deleted', { id: req.params.id });
  res.json({ message: 'Deleted' });
});

export default router;
