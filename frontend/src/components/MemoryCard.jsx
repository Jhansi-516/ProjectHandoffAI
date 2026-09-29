export default function MemoryCard({ m, i }) {
  return <div className="mem"><span className="badge">M{i + 1} · {m.type}</span> {m.context && <small>({m.context})</small>}<div>{m.text}</div></div>;
}
