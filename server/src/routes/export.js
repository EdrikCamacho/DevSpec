import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import archiver from 'archiver';

const router = Router();

async function gatherProjectData(projectId) {
  const [project, members, stakeholders, actors, processes, activities, requirements, uml] = await Promise.all([
    supabaseAdmin.from('projects').select('*, users!projects_owner_id_fkey(full_name, email)').eq('id', projectId).single(),
    supabaseAdmin.from('project_members').select('role, users(full_name, email)').eq('project_id', projectId),
    supabaseAdmin.from('stakeholders').select('*').eq('project_id', projectId),
    supabaseAdmin.from('actors').select('*').eq('project_id', projectId),
    supabaseAdmin.from('processes').select('*').eq('project_id', projectId),
    supabaseAdmin.from('collection_activities').select('*').eq('project_id', projectId),
    supabaseAdmin.from('requirements').select('*').eq('project_id', projectId),
    supabaseAdmin.from('uml_diagrams').select('*').eq('project_id', projectId),
  ]);

  return {
    project: project.data,
    members: members.data || [],
    stakeholders: stakeholders.data || [],
    actors: actors.data || [],
    processes: processes.data || [],
    activities: activities.data || [],
    requirements: requirements.data || [],
    uml: uml.data || [],
  };
}

function buildMasterPrompt(data) {
  const { project, members, stakeholders, actors, processes, activities, requirements, uml } = data;

  const req_funcional = requirements.filter(r => r.type === 'funcional');
  const req_no_funcional = requirements.filter(r => r.type === 'no_funcional');

  return `# MASTER PROMPT — ${project.name}
> Generado por DevSpec Pro | ${new Date().toLocaleDateString('es-ES')}

---

## 📋 DESCRIPCIÓN DEL PROYECTO
**Nombre:** ${project.name}
**Descripción:** ${project.description || 'Sin descripción'}
**Prioridad:** ${project.priority}
**Propietario:** ${project.users?.full_name || 'N/A'} (${project.users?.email || ''})
**Creado:** ${new Date(project.created_at).toLocaleDateString('es-ES')}

---

## 👥 EQUIPO DEL PROYECTO
${members.length === 0 ? 'Sin colaboradores adicionales.' : members.map(m => `- **${m.users?.full_name}** (${m.users?.email}) — Rol: ${m.role}`).join('\n')}

---

## 🎯 STAKEHOLDERS
${stakeholders.length === 0 ? 'Sin stakeholders registrados.' : stakeholders.map(s =>
`### ${s.name}
- **Rol:** ${s.role || 'N/A'}
- **Influencia:** ${s.influence}
- **Notas:** ${s.notes || 'N/A'}`
).join('\n\n')}

---

## 🤖 ACTORES DEL SISTEMA
${actors.length === 0 ? 'Sin actores registrados.' : actors.map(a =>
`- **${a.name}** (${a.type === 'humano' ? 'Humano' : 'Sistema externo'}): ${a.description || 'Sin descripción'}`
).join('\n')}

---

## ⚙️ PROCESOS DE NEGOCIO
${processes.length === 0 ? 'Sin procesos registrados.' : processes.map(p =>
`### ${p.name}
- **Objetivo:** ${p.objective || 'N/A'}
- **Entradas:** ${p.inputs || 'N/A'}
- **Salidas:** ${p.outputs || 'N/A'}
- **Casos de uso:** ${p.use_cases || 'N/A'}`
).join('\n\n')}

---

## 📋 REQUERIMIENTOS FUNCIONALES
${req_funcional.length === 0 ? 'Sin requerimientos funcionales.' : req_funcional.map((r, i) =>
`${i + 1}. **[${r.priority.toUpperCase()}]** ${r.title}
   ${r.description || ''}`
).join('\n')}

---

## 🔧 REQUERIMIENTOS NO FUNCIONALES
${req_no_funcional.length === 0 ? 'Sin requerimientos no funcionales.' : req_no_funcional.map((r, i) =>
`${i + 1}. **[${r.priority.toUpperCase()}]** ${r.title}
   ${r.description || ''}`
).join('\n')}

---

## 📊 ACTIVIDADES DE RECOLECCIÓN
${activities.length === 0 ? 'Sin actividades registradas.' : activities.map(a =>
`- **${a.activity}** — ${a.date ? new Date(a.date).toLocaleDateString('es-ES') : 'Sin fecha'} — Estado: ${a.status}${a.notes ? ` — ${a.notes}` : ''}`
).join('\n')}

---

## 🏗️ DIAGRAMAS UML
${uml.length === 0 ? 'Sin diagramas generados.' : uml.map(d =>
`### ${d.title} (${d.type})
\`\`\`mermaid
${d.content}
\`\`\``
).join('\n\n')}

---

## 🚀 INSTRUCCIÓN PARA IA

Con base en toda la información anterior, por favor:
1. Construye la arquitectura del sistema de software para "${project.name}"
2. Genera el código fuente organizado por módulos según los requerimientos listados
3. Implementa todos los casos de uso identificados en los procesos de negocio
4. Asegura que el sistema cumpla con los requerimientos no funcionales
5. Sugiere el stack tecnológico más adecuado según la complejidad del proyecto

¡Genera un sistema completo, funcional y bien documentado!
`;
}

// GET /api/export/:projectId/master-prompt
router.get('/:projectId/master-prompt', requireAuth, async (req, res) => {
  try {
    const data = await gatherProjectData(req.params.projectId);
    const prompt = buildMasterPrompt(data);
    res.json({ content: prompt, project: data.project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/:projectId/master-prompt/download — download as .md
router.get('/:projectId/master-prompt/download', requireAuth, async (req, res) => {
  try {
    const data = await gatherProjectData(req.params.projectId);
    const prompt = buildMasterPrompt(data);
    const filename = `master-prompt-${data.project.name.replace(/\s+/g, '-').toLowerCase()}.md`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(prompt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/:projectId/zip — download all as ZIP
router.get('/:projectId/zip', requireAuth, async (req, res) => {
  try {
    const data = await gatherProjectData(req.params.projectId);
    const projectName = data.project.name.replace(/\s+/g, '-').toLowerCase();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="devspec-${projectName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Add master prompt
    archive.append(buildMasterPrompt(data), { name: 'master-prompt.md' });

    // Add requirements as CSV
    const reqCsv = ['ID,Título,Tipo,Prioridad,Estado,Descripción',
      ...data.requirements.map(r =>
        `${r.id},"${r.title}","${r.type}","${r.priority}","${r.status}","${(r.description || '').replace(/"/g, '""')}"`
      )
    ].join('\n');
    archive.append(reqCsv, { name: 'requirements.csv' });

    // Add UML diagrams
    data.uml.forEach(d => {
      archive.append(d.content, { name: `uml/${d.type}-${d.title.replace(/\s+/g, '-')}.mmd` });
    });

    // Add project JSON
    archive.append(JSON.stringify(data, null, 2), { name: 'project-data.json' });

    await archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
