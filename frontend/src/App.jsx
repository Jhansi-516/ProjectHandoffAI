import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { api } from './api.js';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NewProjectPage from './pages/NewProjectPage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';

export default function App() {
  const [h, setH] = useState(null);
  useEffect(() => { api.get('/health').then((r) => setH(r.data)).catch(() => setH({ down: true })); }, []);
  return (<><Navbar /><main>
    {h?.down && <div className="warn">Backend not reachable. Start it on port 3001.</div>}
    {h && !h.down && (!h.llm || !h.memory) && <div className="warn">Setup needed in backend/.env: {!h.llm && 'Groq (GROQ_API_KEY, LLM_MODEL): AI answers unavailable. '}{!h.memory && 'Hindsight (HINDSIGHT_API_KEY): memory unavailable.'}</div>}
    <Routes><Route path="/" element={<LandingPage />} /><Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/new" element={<NewProjectPage />} /><Route path="/p/:id" element={<WorkspacePage />} /></Routes></main></>);
}
