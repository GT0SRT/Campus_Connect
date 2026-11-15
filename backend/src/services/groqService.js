const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

function safeJsonParse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function chatCompletion({ model, messages, temperature = 0.2, maxTokens = 1024 }) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });
  return completion?.choices?.[0]?.message?.content || '';
}

module.exports = {
  groq,
  safeJsonParse,
  chatCompletion,
};
