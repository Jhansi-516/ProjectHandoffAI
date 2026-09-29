import { useState } from 'react';
import { api, errMsg } from '../api.js';
import FileTree from '../components/FileTree.jsx';
import CodeViewer from '../components/CodeViewer.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
export default function FilesTab({ p }) {
  const [sel, setSel] = useState(null), [txt, setTxt] = useState(''), [err, setErr] = useState('');
  async function open(f) { setSel(f); setErr(''); try { setTxt((await api.get(`/projects/${p.id}/files/${f.id}`)).data.content); } catch (e) { setErr(errMsg(e)); } }
  return (<div className="files"><FileTree files={p.files} selected={sel?.path} onSelect={open} /><div><ErrorMessage error={err} /><CodeViewer path={sel?.path} content={txt} /></div></div>);
}
