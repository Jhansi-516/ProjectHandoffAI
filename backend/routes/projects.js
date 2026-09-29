import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ROOT, dir, load, save, wrap, withProject, list, read } from '../storage.js';
import { HISTORY, safeWrite, accept } from '../zipUtils.js';

const router = express.Router();
const upload = multer({ dest: path.resolve('data', 'tmp'), limits: { fileSize: 25 * 1024 * 1024, files: 20 } });

router.post('/api/projects', upload.fields([{ name: 'zip', maxCount: 1 }, { name: 'history', maxCount: 15 }]), wrap((req, res) => {
  const name = (req.body.name || '').trim();
  const zipF = req.files?.zip?.[0];
  const tmp = [zipF, ...(req.files?.history || [])].filter(Boolean);
  try {
    if (!name || !zipF) return res.status(400).json({ error: 'Project name and a ZIP file are required' });
    const id = crypto.randomUUID();
    const base = path.join(dir(id), 'original');
    fs.mkdirSync(base, { recursive: true });
    const m = { id, name, createdAt: new Date().toISOString(), status: 'created', files: [], skipped: [], analysis: null, generation: null };
    const add = (p, buf, kind) => {
      const why = accept(p, buf.length);
      if (why) return m.skipped.push({ path: p, reason: why });
      if (m.files.some((f) => f.path === p)) return m.skipped.push({ path: p, reason: 'duplicate' });
      if (!safeWrite(base, p, buf)) return m.skipped.push({ path: p, reason: 'unsafe path' });
      m.files.push({ id: String(m.files.length), path: p, size: buf.length, kind });
    };
    let zip;
    try { zip = new AdmZip(zipF.path); } catch { return res.status(400).json({ error: 'Not a valid ZIP file' }); }
    for (const e of zip.getEntries()) {
      if (e.isDirectory) continue;
      const p = e.entryName.replace(/\\/g, '/');
      add(p, e.getData(), HISTORY.test(path.basename(p)) ? 'history' : 'source');
    }
    for (const h of req.files?.history || []) add('history/' + path.basename(h.originalname), fs.readFileSync(h.path), 'history');
    if (!m.files.length) return res.status(400).json({ error: 'No usable files found in the upload', skipped: m.skipped });
    save(m);
    res.json({ id, accepted: m.files.length, skipped: m.skipped });
  } finally { tmp.forEach((f) => fs.rmSync(f.path, { force: true })); }
}));

router.get('/api/projects', wrap((_q, res) => {
  const out = fs.readdirSync(ROOT).map(load).filter(Boolean).map((m) => ({ id: m.id, name: m.name, createdAt: m.createdAt, status: m.status }));
  res.json(out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}));
router.get('/api/projects/:projectId', withProject((_q, res, m) => res.json({ ...m, files: list(m) })));
router.get('/api/projects/:projectId/files', withProject((_q, res, m) => res.json(list(m))));
router.get('/api/projects/:projectId/files/:fileId', withProject((req, res, m) => {
  const f = m.files.find((x) => x.id === req.params.fileId);
  if (!f) return res.status(404).json({ error: 'File not found' });
  res.json({ path: f.path, content: read(m, f) });
}));

router.get('/api/projects/:projectId/download', withProject((_q, res, m) => {
  const gen = path.join(dir(m.id), 'generated');
  if (!fs.existsSync(gen)) return res.status(404).json({ error: 'Nothing generated yet' });
  const zip = new AdmZip(); zip.addLocalFolder(gen);
  res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${m.name.replace(/[^\w-]+/g, '_')}-generated.zip"` });
  res.send(zip.toBuffer());
}));


export default router;
