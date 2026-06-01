import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { logAudit } from '../utils/helpers.js';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DIAGRAM_PROMPTS = {
  casos_uso: (project, actors, processes, requirements) => `
    Generate a Mermaid.js use case diagram for the software project "${project.name}".
    Description: ${project.description || 'N/A'}
    
    System Actors: ${actors.map(a => a.name).join(', ') || 'User'}
    Business Processes: ${processes.map(p => p.name).join(', ') || 'N/A'}
    Key Requirements: ${requirements.slice(0, 8).map(r => r.title).join(', ') || 'N/A'}
    
    IMPORTANT: Return ONLY the Mermaid diagram code starting with the diagram type.
    Use this exact format:
    graph TD
      actor1([Actor Name])
      useCase1[Use Case 1]
      actor1 --> useCase1
    
    Or for more complex:
    %%{init: {'theme':'dark'}}%%
    classDiagram or sequenceDiagram etc.
    
    Do not include any explanations, just pure Mermaid code.
  `,
  clases: (project, actors, processes, requirements) => `
    Generate a Mermaid.js class diagram for the software project "${project.name}".
    Description: ${project.description || 'N/A'}
    Requirements: ${requirements.map(r => r.title).join(', ') || 'N/A'}
    
    Create realistic class relationships with attributes and methods.
    Return ONLY valid Mermaid classDiagram code. No explanations.
  `,
  secuencia: (project, actors, processes, requirements) => `
    Generate a Mermaid.js sequence diagram for the main workflow of "${project.name}".
    Actors: ${actors.map(a => a.name).join(', ') || 'User, System'}
    Main process: ${processes[0]?.name || requirements[0]?.title || 'Main Flow'}
    
    Return ONLY valid Mermaid sequenceDiagram code. No explanations.
  `,
  paquetes: (project, actors, processes, requirements) => `
    Generate a Mermaid.js package/component diagram for "${project.name}".
    Show logical grouping of system components based on:
    Processes: ${processes.map(p => p.name).join(', ') || 'N/A'}
    Requirements: ${requirements.map(r => r.title).join(', ') || 'N/A'}
    
    Return ONLY valid Mermaid graph TD code showing packages/modules. No explanations.
  `,
  componentes: (project, actors, processes, requirements) => `
    Generate a Mermaid.js component architecture diagram for "${project.name}".
    Show system components and their dependencies for a software project.
    Use C4 or standard component notation in Mermaid.
    
    Return ONLY valid Mermaid code. No explanations.
  `,
};

// GET /api/uml/:projectId — list diagrams
router.get('/:projectId', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('uml_diagrams')
    .select('*, users(full_name, avatar_url)')
    .eq('project_id', req.params.projectId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/uml/:projectId/generate — AI generation
router.post('/:projectId/generate', requireAuth, async (req, res) => {
  try {
    const { type, title } = req.body;
    const { projectId } = req.params;

    if (!type) return res.status(400).json({ error: 'Diagram type is required' });

    // Gather project context
    const [projectRes, actorsRes, processesRes, requirementsRes] = await Promise.all([
      supabaseAdmin.from('projects').select('name, description').eq('id', projectId).single(),
      supabaseAdmin.from('actors').select('name, type').eq('project_id', projectId),
      supabaseAdmin.from('processes').select('name, objective').eq('project_id', projectId),
      supabaseAdmin.from('requirements').select('title, type, priority').eq('project_id', projectId),
    ]);

    const project = projectRes.data || {};
    const actors = actorsRes.data || [];
    const processes = processesRes.data || [];
    const requirements = requirementsRes.data || [];

    const promptFn = DIAGRAM_PROMPTS[type];
    if (!promptFn) return res.status(400).json({ error: 'Invalid diagram type' });

    const prompt = promptFn(project, actors, processes, requirements);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a UML expert specializing in Mermaid.js diagrams. Generate only valid Mermaid diagram code without any markdown code fences or explanations.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    let content = completion.choices[0].message.content.trim();
    // Strip markdown fences if present
    content = content.replace(/^```mermaid\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    const diagramTitle = title || `Diagrama ${type.replace('_', ' ')} - ${project.name}`;

    const { data, error } = await supabaseAdmin
      .from('uml_diagrams')
      .insert({
        project_id: projectId,
        type,
        title: diagramTitle,
        content,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(projectId, req.user.id, 'uml_generated', { type, title: diagramTitle });

    res.status(201).json(data);
  } catch (err) {
    console.error('UML generation error:', err);
    if (err?.status === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/uml/:projectId — manual create
router.post('/:projectId', requireAuth, async (req, res) => {
  const { type, title, content } = req.body;
  if (!type || !content) return res.status(400).json({ error: 'Type and content are required' });
  const { data, error } = await supabaseAdmin
    .from('uml_diagrams')
    .insert({ project_id: req.params.projectId, type, title: title || 'Untitled', content, created_by: req.user.id })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'uml_created', { type, title });
  res.status(201).json(data);
});

// PATCH /api/uml/:projectId/:id
router.patch('/:projectId/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('uml_diagrams')
    .update({ ...req.body, updated_at: new Date() })
    .eq('id', req.params.id)
    .eq('project_id', req.params.projectId)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/uml/:projectId/:id
router.delete('/:projectId/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('uml_diagrams')
    .delete()
    .eq('id', req.params.id)
    .eq('project_id', req.params.projectId);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req.params.projectId, req.user.id, 'uml_deleted', { id: req.params.id });
  res.json({ message: 'Deleted' });
});

export default router;
