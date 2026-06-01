-- ============================================================
-- DevSpec Pro — Supabase Realtime + Storage
-- ============================================================

-- Enable Realtime on relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.actors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.processes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requirements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.uml_diagrams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Storage buckets
-- ============================================================

-- Avatar bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Project assets bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Members can access project assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-assets' AND
    is_project_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "Editors can upload project assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-assets' AND
    is_project_editor((storage.foldername(name))[1]::UUID)
  );
