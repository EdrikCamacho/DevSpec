import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import projectsRouter from './routes/projects.js';
import membersRouter from './routes/members.js';
import stakeholdersRouter from './routes/stakeholders.js';
import actorsRouter from './routes/actors.js';
import processesRouter from './routes/processes.js';
import requirementsRouter from './routes/requirements.js';
import umlRouter from './routes/uml.js';
import auditRouter from './routes/audit.js';
import notificationsRouter from './routes/notifications.js';
import githubRouter from './routes/github.js';
import exportRouter from './routes/export.js';
import aiRouter from './routes/ai.js';
import usersRouter from './routes/users.js';
import collectionRouter from './routes/collection.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/members', membersRouter);
app.use('/api/stakeholders', stakeholdersRouter);
app.use('/api/actors', actorsRouter);
app.use('/api/processes', processesRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/requirements', requirementsRouter);
app.use('/api/uml', umlRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/github', githubRouter);
app.use('/api/export', exportRouter);
app.use('/api/ai', aiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DevSpec Pro API running on http://localhost:${PORT}`);
});

export default app;
