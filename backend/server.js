import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as hs from './hindsight.js';
import { llmConfigured } from './llm.js';
import projects from './routes/projects.js';
import agent from './routes/agent.js';

const app = express();
app.use(cors({ origin: /localhost|127\.0\.0\.1/ }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_q, r) => r.json({ ok: true, llm: llmConfigured(), memory: hs.configured() }));
app.use(projects);
app.use(agent);

app.use((err, _q, res, _n) => res.status(400).json({ error: err.message }));
app.listen(process.env.PORT || 3001, () => console.log(`Backend on :${process.env.PORT || 3001}`));
