-- ============================================================
-- DevSpec Pro — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  city        TEXT,
  avatar_url  TEXT,
  skills      TEXT[] DEFAULT '{}',
  available   BOOLEAN DEFAULT TRUE,
  github_username TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  visibility  TEXT DEFAULT 'private' CHECK (visibility IN ('private','public')),
  priority    TEXT DEFAULT 'media' CHECK (priority IN ('alta','media','baja')),
  github_repo TEXT,
  github_token TEXT,
  progress    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('editor','reader')),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- STAKEHOLDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT,
  influence   TEXT DEFAULT 'media' CHECK (influence IN ('alta','media','baja')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.actors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'humano' CHECK (type IN ('humano','sistema_externo')),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROCESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.processes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  objective   TEXT,
  inputs      TEXT,
  outputs     TEXT,
  use_cases   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COLLECTION ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collection_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  activity    TEXT NOT NULL CHECK (activity IN ('entrevista','cuestionario','taller')),
  date        DATE,
  status      TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_progreso','completado')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REQUIREMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.requirements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT DEFAULT 'media' CHECK (priority IN ('alta','media','baja')),
  type        TEXT DEFAULT 'funcional' CHECK (type IN ('funcional','no_funcional')),
  status      TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_progreso','completado')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UML DIAGRAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.uml_diagrams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('casos_uso','clases','secuencia','paquetes','componentes')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  project_id  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONNECTION REQUESTS (User Directory)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_project ON public.stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_actors_project ON public.actors(project_id);
CREATE INDEX IF NOT EXISTS idx_processes_project ON public.processes(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_project ON public.requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_uml_project ON public.uml_diagrams(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_project ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER uml_updated_at BEFORE UPDATE ON public.uml_diagrams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER — Auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, city)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
