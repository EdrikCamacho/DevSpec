import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/me — get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/sync — manual fallback sync for profile metadata
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { full_name, phone, city } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: req.user.id,
        email: req.user.email,
        full_name: full_name || req.user.user_metadata?.full_name,
        phone: phone || req.user.user_metadata?.phone,
        city: city || req.user.user_metadata?.city,
        updated_at: new Date()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Profile synced successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
