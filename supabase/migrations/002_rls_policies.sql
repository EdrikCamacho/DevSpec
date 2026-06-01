-- ============================================================
-- DevSpec Pro — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uml_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: is_project_member
-- ============================================================
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_project_editor(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid() AND role = 'editor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- USERS policies
-- ============================================================
CREATE POLICY "Users can read all profiles" ON public.users
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- PROJECTS policies
-- ============================================================
CREATE POLICY "Members can view projects" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid() OR
    visibility = 'public' OR
    is_project_member(id)
  );

CREATE POLICY "Owners can insert projects" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update projects" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete projects" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================
-- PROJECT MEMBERS policies
-- ============================================================
CREATE POLICY "Members can view memberships" ON public.project_members
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Owners can manage members" ON public.project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

-- ============================================================
-- STAKEHOLDERS policies
-- ============================================================
CREATE POLICY "Members can view stakeholders" ON public.stakeholders
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Editors can manage stakeholders" ON public.stakeholders
  FOR ALL USING (is_project_editor(project_id));

-- ============================================================
-- ACTORS policies
-- ============================================================
CREATE POLICY "Members can view actors" ON public.actors
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Editors can manage actors" ON public.actors
  FOR ALL USING (is_project_editor(project_id));

-- ============================================================
-- PROCESSES policies
-- ============================================================
CREATE POLICY "Members can view processes" ON public.processes
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Editors can manage processes" ON public.processes
  FOR ALL USING (is_project_editor(project_id));

-- ============================================================
-- COLLECTION ACTIVITIES policies
-- ============================================================
CREATE POLICY "Members can view activities" ON public.collection_activities
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Editors can manage activities" ON public.collection_activities
  FOR ALL USING (is_project_editor(project_id));

-- ============================================================
-- REQUIREMENTS policies
-- ============================================================
CREATE POLICY "Members can view requirements" ON public.requirements
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Editors can manage requirements" ON public.requirements
  FOR ALL USING (is_project_editor(project_id));

-- ============================================================
-- UML DIAGRAMS policies
-- ============================================================
CREATE POLICY "Members can view diagrams" ON public.uml_diagrams
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Editors can manage diagrams" ON public.uml_diagrams
  FOR ALL USING (is_project_editor(project_id));

-- ============================================================
-- AUDIT LOGS policies
-- ============================================================
CREATE POLICY "Members can view audit logs" ON public.audit_logs
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- CONNECTION REQUESTS policies
-- ============================================================
CREATE POLICY "Users can view own connection requests" ON public.connection_requests
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send connection requests" ON public.connection_requests
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Recipients can update requests" ON public.connection_requests
  FOR UPDATE USING (to_user_id = auth.uid());
