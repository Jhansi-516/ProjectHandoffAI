export const llmConfigured = () => !!(process.env.GROQ_API_KEY && process.env.LLM_MODEL);
export async function chat(messages, json = false) {
  if (!llmConfigured()) throw new Error('LLM is not configured: set GROQ_API_KEY and LLM_MODEL in backend/.env');
  const res = await fetch(`${process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: process.env.LLM_MODEL, messages, temperature: 0.2, ...(json && { response_format: { type: 'json_object' } }) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${data?.error?.message || 'request failed'}`);
  return data.choices[0].message.content;
}
