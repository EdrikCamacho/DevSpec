import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/demo-builder/:projectId — generate HTML/CSS/JS demo
router.post('/demo-builder/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { screenDescription } = req.body;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .single();

    const { data: requirements } = await supabaseAdmin
      .from('requirements')
      .select('title, description, type')
      .eq('project_id', projectId)
      .eq('type', 'funcional')
      .limit(10);

    const prompt = `
You are a senior UI/UX developer. Create a complete, self-contained HTML file for a demo screen of the software project "${project?.name}".

Project description: ${project?.description || 'N/A'}
Key requirements: ${(requirements || []).map(r => r.title).join(', ')}
Screen to generate: ${screenDescription || 'Main dashboard overview'}

Requirements for the HTML:
1. Use modern, dark UI design with purple accent colors (#7C3AED)
2. Must be fully self-contained (all CSS and JS inline in the HTML)
3. Use realistic placeholder data that matches the project context
4. Include interactive elements (buttons, modals, tabs) with JavaScript
5. Use CSS Grid/Flexbox for layout
6. Include Google Fonts (Inter)
7. Make it look professional and production-ready

Return ONLY the complete HTML code, nothing else.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert frontend developer. Return only valid, complete HTML code.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.5,
    });

    let html = completion.choices[0].message.content.trim();
    // Strip markdown fences if present
    html = html.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    res.json({ html, project });
  } catch (err) {
    console.error('AI demo builder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suggest-requirements/:projectId
router.post('/suggest-requirements/:projectId', requireAuth, async (req, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name, description')
      .eq('id', req.params.projectId)
      .single();

    const { data: existing } = await supabaseAdmin
      .from('requirements')
      .select('title')
      .eq('project_id', req.params.projectId);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a software requirements analyst. Respond in Spanish.' },
        {
          role: 'user',
          content: `Project: ${project?.name}\nDescription: ${project?.description}\nExisting requirements: ${(existing || []).map(r => r.title).join(', ')}\n\nSuggest 5 additional software requirements (mix of functional and non-functional) not already covered. Return as JSON array: [{"title": "...", "description": "...", "type": "funcional|no_funcional", "priority": "alta|media|baja"}]`
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(completion.choices[0].message.content);
    res.json(content.requirements || content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
