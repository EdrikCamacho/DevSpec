import { supabaseAdmin } from '../config/supabase.js';

export async function logAudit(projectId, userId, action, details = {}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      project_id: projectId,
      user_id: userId,
      action,
      details,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export async function createNotification(userId, message, type = 'info', projectId = null) {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      message,
      type,
      project_id: projectId,
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
}
