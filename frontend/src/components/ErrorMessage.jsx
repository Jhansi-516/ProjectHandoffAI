export default function ErrorMessage({ error }) { return error ? <p className="err" role="alert">{error}</p> : null; }
