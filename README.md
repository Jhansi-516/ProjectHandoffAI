# ProjectHandoff AI (MVP)

## Setup (Windows-friendly; needs Node 18+)
**Terminal 1 – backend**
```
cd backend
copy .env.example .env
npm install
npm start
```
Edit `backend/.env`: set `GROQ_API_KEY`, `LLM_MODEL` (a model id from your Groq console) and `HINDSIGHT_API_KEY`.

**Terminal 2 – frontend**
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 (Vite proxies `/api` to port 3001).

## API
GET /api/health · POST/GET /api/projects · GET /api/projects/:id · GET .../files · GET .../files/:fileId · POST .../analyze · POST .../chat · POST .../memories (extra: recall for the Memory tab) · POST .../import-history · POST .../outcome `{result:"worked"|"failing",notes}` · POST .../generate `{message}` · GET .../download

## Data flow
Upload ZIP → server validates/extracts safe text files into `backend/data/projects/<id>/original` → question → Hindsight `recall` on bank `<BANK_PREFIX>-<projectId>` → history + relevant files + memories sent to Groq → answer and recalled memories shown in UI → generation writes a separate `generated/` copy → "Worked/Still failing" is `retain`ed to the same bank → later questions recall it.

## Manual test checklist
1. /api/health shows llm+memory true. 2. Upload Team Task Tracker ZIP (+ docs). Skipped list shows node_modules/.env. 3. Files tab opens files. 4. Analyze. 5. Memory tab → Import history → memories appear (may take a moment to index). 6. Ask the CSV export question; check recalled memories and fact/hypothesis sections. 7. Generate; inspect files; download ZIP; run it yourself. 8. Click Worked/Still failing with notes. 9. Ask a CSV follow-up; confirm the outcome is recalled. 10. Create a second project; confirm memories don't leak.

## Not implemented / unverified
**Verified in the build sandbox (no network):** `node --check` on every backend file only.
**NOT verified:** `npm install`, frontend build (`npm run build`), running either server, any endpoint call, the Hindsight SDK method names/response shape (`backend/hindsight.js` is the only file to adjust), Groq JSON mode for your chosen model, and the whole demo scenario.
**Limitations:** chat answers render as plain text (not Markdown); extension-based file filtering; no auth; large projects are truncated by a character budget; no sample project bundled; generated code is never executed.

## Layout
backend: server.js, hindsight.js, llm.js, storage.js, projectAnalyzer.js, zipUtils.js, routes/{projects,agent}.js, data/
frontend/src: main.jsx, App.jsx, api.js, styles.css, components/*, pages/*
