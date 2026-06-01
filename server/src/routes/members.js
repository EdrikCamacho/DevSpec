import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit, createNotification } from '../utils/helpers.js';

const router = Router();

// GET /api/members/:projectId — list members
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('project_members')
      .select('*, users(id, full_name, email, avatar_url, city)')
      .eq('project_id', req.params.projectId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members/:projectId/invite — invite by email
router.post('/:projectId/invite', requireAuth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const { projectId } = req.params;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Find user by email
    const { data: targetUser, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('email', email)
      .single();

    if (userErr || !targetUser) {
      return res.status(404).json({ error: 'User not found. They must register first.' });
    }

    // Check not already a member
    const { data: existing } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUser.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    // Get project name for notification
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .insert({ project_id: projectId, user_id: targetUser.id, role: role || 'reader' })
      .select()
      .single();

    if (error) throw error;

    await createNotification(
      targetUser.id,
      `You've been invited to the project "${project?.name}" as ${role || 'reader'}`,
      'info',
      projectId
    );

    await logAudit(projectId, req.user.id, 'member_invited', {
      invited_user: targetUser.email,
      role: role || 'reader',
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/members/:projectId/:userId — update role
router.patch('/:projectId/:userId', requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const { projectId, userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    await logAudit(projectId, req.user.id, 'member_role_updated', { user_id: userId, role });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/members/:projectId/:userId — remove member
router.delete('/:projectId/:userId', requireAuth, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const { error } = await supabaseAdmin
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;

    await logAudit(projectId, req.user.id, 'member_removed', { user_id: userId });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
