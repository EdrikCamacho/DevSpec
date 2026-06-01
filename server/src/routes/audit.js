import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/audit/:projectId
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    const { data, error, count } = await supabaseAdmin
      .from('audit_logs')
      .select('*, users(full_name, avatar_url)', { count: 'exact' })
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
