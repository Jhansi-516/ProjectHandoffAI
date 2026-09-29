import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
export default function DashboardPage() {
  const [ps, setPs] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api.get('/projects').then((r) => setPs(r.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (err) return <ErrorMessage error={err} />;
  if (!ps) return <LoadingState />;
  if (!ps.length) return <div className="card"><h3>No projects yet</h3><Link className="btn" to="/new">Add your first project</Link></div>;
  return <div className="grid">{ps.map((p) => <div className="card" key={p.id}><h3>{p.name}</h3><p>{new Date(p.createdAt).toLocaleString()}</p><span className="badge">{p.status}</span><p><Link className="btn" to={`/p/${p.id}`}>Open</Link></p></div>)}</div>;
}
