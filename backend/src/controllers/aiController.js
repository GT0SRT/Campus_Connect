const { chatCompletion, safeJsonParse } = require('./groqService');
const { computeWeightedMatch } = require('./graphMatchmakerService');

async function postMatchmakerFilters(req, res) {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const system = `You are a teammate matchmaker API. Extract requirements into strict JSON only.
Output EXACTLY:
{"strict_filters":{"campus":"","branch":"","batch":""},"scoring_filters":{"skills_any":[],"interests_any":[],"looking_for_any":[]},"status_any":"any"}`;
    const raw = await chatCompletion({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      maxTokens: 512,
    });
    const parsed = safeJsonParse(raw) || {
      strict_filters: { campus: '', branch: '', batch: '' },
      scoring_filters: { skills_any: [], interests_any: [], looking_for_any: [] },
      status_any: 'any',
    };
    return res.json({ status: 'success', filters: parsed });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Matchmaker filters failed' });
  }
}

async function postMatchmakerScore(req, res) {
  try {
    const currentUser = req.body?.currentUser || {};
    const candidates = Array.isArray(req.body?.candidates) ? req.body.candidates : [];
    const matches = computeWeightedMatch(currentUser, candidates);
    return res.json({ status: 'success', matches });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Matchmaker scoring failed' });
  }
}

async function postGenerate(req, res) {
  try {
    const image = req.body?.image;
    const instruction = String(req.body?.instruction || 'concise').trim() || 'concise';
    if (!image) return res.status(400).json({ error: 'image is required' });
    return res.status(501).json({
      error: 'Image captioning is not configured on the backend Groq integration. Use a dedicated vision endpoint or keep ai-engine temporarily.',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Generate failed' });
  }
}

async function postChat(req, res) {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message is required' });
    const reply = await chatCompletion({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are CampusConnect assistant. Be helpful, concise, and friendly.' },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      maxTokens: 512,
    });
    return res.json({ status: 'success', reply });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Chat failed' });
  }
}

async function postDraft(req, res) {
  try {
    const context = String(req.body?.context || req.body?.prompt || '').trim();
    if (!context) return res.status(400).json({ error: 'context or prompt is required' });
    const reply = await chatCompletion({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Draft a clear, short campus social post or caption. No emojis unless asked.' },
        { role: 'user', content: context },
      ],
      temperature: 0.4,
      maxTokens: 256,
    });
    return res.json({ status: 'success', text: reply });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Draft failed' });
  }
}

async function postIcebreaker(req, res) {
  try {
    const name = String(req.body?.name || 'there').trim();
    const context = String(req.body?.context || '').trim();
    const reply = await chatCompletion({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Write a short friendly squad/group chat icebreaker (1-2 sentences). No emojis.' },
        { role: 'user', content: `Name: ${name}. Context: ${context || 'general campus collaboration'}` },
      ],
      temperature: 0.5,
      maxTokens: 120,
    });
    return res.json({ status: 'success', text: reply });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Icebreaker failed' });
  }
}

module.exports = {
  postMatchmakerFilters,
  postMatchmakerScore,
  postGenerate,
  postChat,
  postDraft,
  postIcebreaker,
};
