// Groups files by top-level folder; click selects a file object.
export default function FileTree({ files, selected, onSelect }) {
  const groups = {};
  files.forEach((f) => { const i = f.path.indexOf('/'); (groups[i < 0 ? '(root)' : f.path.slice(0, i)] ??= []).push(f); });
  return (<div className="card ft">{Object.entries(groups).map(([g, fs]) => (
    <div key={g}><strong>{g}</strong>{fs.map((f) => <button key={f.path} className={selected === f.path ? 'on' : ''} onClick={() => onSelect(f)}>{f.path}{f.kind === 'history' ? ' 📜' : ''}</button>)}</div>))}</div>);
}
