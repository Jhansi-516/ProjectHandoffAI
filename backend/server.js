import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import * as hs from './hindsight.js';
import { llmConfigured } from './llm.js';

import projects from './routes/projects.js';
import agent from './routes/agent.js';

const app = express();

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as health checks.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    llm: llmConfigured(),
    memory: hs.configured(),
  });
});

app.use(projects);
app.use(agent);

// Return API errors as JSON.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({
    error: err.message || 'Something went wrong',
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend on :${PORT}`);
});