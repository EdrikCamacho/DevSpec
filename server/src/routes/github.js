import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { Octokit } from '@octokit/rest';

const router = Router();

// GET /api/github/callback — OAuth callback
router.get('/callback', requireAuth, async (req, res) => {
  try {
    const { code, state } = req.query;
    const projectId = state;

    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    // Store token (encrypted in prod) and redirect
    res.json({ access_token: tokenData.access_token, projectId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/github/connect — connect repo to project
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const { projectId, repoUrl, accessToken } = req.body;

    if (!projectId || !repoUrl || !accessToken) {
      return res.status(400).json({ error: 'projectId, repoUrl, and accessToken are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ github_repo: repoUrl, github_token: accessToken })
      .eq('id', projectId)
      .eq('owner_id', req.user.id)
      .select().single();

    if (error) throw error;
    res.json({ message: 'Repository connected', project: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/github/:projectId/commits — recent commits
router.get('/:projectId/commits', requireAuth, async (req, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('github_repo, github_token')
      .eq('id', req.params.projectId)
      .single();

    if (!project?.github_repo) {
      return res.status(404).json({ error: 'No GitHub repository connected' });
    }

    const [owner, repo] = project.github_repo.replace('https://github.com/', '').split('/');
    const octokit = new Octokit({ auth: project.github_token });

    const { data: commits } = await octokit.rest.repos.listCommits({
      owner, repo, per_page: 20,
    });

    res.json(commits.map(c => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/github/:projectId/branches — list branches
router.get('/:projectId/branches', requireAuth, async (req, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('github_repo, github_token')
      .eq('id', req.params.projectId)
      .single();

    if (!project?.github_repo) {
      return res.status(404).json({ error: 'No GitHub repository connected' });
    }

    const [owner, repo] = project.github_repo.replace('https://github.com/', '').split('/');
    const octokit = new Octokit({ auth: project.github_token });

    const { data: branches } = await octokit.rest.repos.listBranches({ owner, repo });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/github/:projectId/issues — create issue from requirement
router.post('/:projectId/issues', requireAuth, async (req, res) => {
  try {
    const { requirementId, title, body, labels } = req.body;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('github_repo, github_token')
      .eq('id', req.params.projectId)
      .single();

    if (!project?.github_repo) {
      return res.status(404).json({ error: 'No GitHub repository connected' });
    }

    const [owner, repo] = project.github_repo.replace('https://github.com/', '').split('/');
    const octokit = new Octokit({ auth: project.github_token });

    const { data: issue } = await octokit.rest.issues.create({
      owner, repo, title, body, labels: labels || ['devspec-pro'],
    });

    res.status(201).json({ url: issue.html_url, number: issue.number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
