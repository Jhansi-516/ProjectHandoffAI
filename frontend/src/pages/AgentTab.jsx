import { useState } from 'react';
import { api, errMsg } from '../api.js';
import ChatMessage from '../components/ChatMessage.jsx';
const PROMPTS = ['Explain how this project works.', 'What features already exist?', 'I want to add CSV export. What should I check first?', 'Investigate this error using the project’s history.'];
export default function AgentTab({ p }) {
  const [msgs, setMsgs] = useState([]), [q, setQ] = useState(''), [busy, setBusy] = useState(false);
  async function send(text) {
    if (!text.trim()) return;
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: 'user', content: text }]); setQ(''); setBusy(true);
    try {
      const r = await api.post(`/projects/${p.id}/chat`, { message: text, history });
      setMsgs((m) => [...m, { role: 'assistant', content: r.data.answer, memories: r.data.memories, memoryError: r.data.memoryError }]);
    } catch (e) { setMsgs((m) => [...m, { role: 'assistant', content: 'Error: ' + errMsg(e) }]); } finally { setBusy(false); }
  }
  return (<div><p>{PROMPTS.map((s) => <button key={s} className="btn alt" style={{ margin: 3 }} onClick={() => send(s)} disabled={busy}>{s}</button>)}</p>
    {msgs.map((m, i) => <ChatMessage key={i} m={m} />)}{busy && <p role="status">Thinking…</p>}
    <label htmlFor="q">Ask the agent</label><textarea id="q" rows={3} value={q} onChange={(e) => setQ(e.target.value)} />
    <p><button className="btn" disabled={busy} onClick={() => send(q)}>Send</button></p></div>);
}
