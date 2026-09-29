export default function CodeViewer({ path, content }) {
  if (!path) return <p>Select a file to view it (read-only; nothing is executed).</p>;
  return <div><p><code>{path}</code></p><pre tabIndex={0}>{content}</pre></div>;
}
