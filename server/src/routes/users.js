import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = Router();

// GET /api/users/me — own profile
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

// PATCH /api/users/me — update own profile
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { full_name, phone, city, skills, available, github_username } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ full_name, phone, city, skills, available, github_username, updated_at: new Date() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/directory — smart user search
router.get('/directory', requireAuth, async (req, res) => {
  try {
    const { search, city, available } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, email, city, skills, available, avatar_url, github_username')
      .neq('id', req.user.id);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (available === 'true') {
      query = query.eq('available', true);
    }

    const { data, error } = await query.order('full_name').limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/connect — send connection request
router.post('/:id/connect', requireAuth, async (req, res) => {
  try {
    const toUserId = req.params.id;

    const { data: existing } = await supabaseAdmin
      .from('connection_requests')
      .select('id, status')
      .eq('from_user_id', req.user.id)
      .eq('to_user_id', toUserId)
      .single();

    if (existing) {
      return res.status(400).json({ error: `Connection request already ${existing.status}` });
    }

    const { data, error } = await supabaseAdmin
      .from('connection_requests')
      .insert({ from_user_id: req.user.id, to_user_id: toUserId })
      .select().single();

    if (error) throw error;

    // Get sender info
    const { data: sender } = await supabaseAdmin.from('users').select('full_name').eq('id', req.user.id).single();

    await createNotification(
      toUserId,
      `${sender?.full_name || 'Someone'} wants to connect with you`,
      'info'
    );

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — public profile
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, city, skills, available, avatar_url, github_username, created_at')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
