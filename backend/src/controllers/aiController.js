const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chatCompletion, safeJsonParse } = require('../services/groqService');
const { computeWeightedMatch } = require('../services/graphMatchmakerService');

// Fallback keyword extractor for matchmaker when GROQ is offline
function extractFallbackFilters(prompt) {
  const text = String(prompt || '').toLowerCase();
  const skillsList = ['react', 'node', 'javascript', 'python', 'java', 'c++', 'figma', 'design', 'ai', 'ml', 'html', 'css', 'sql', 'flutter', 'dart'];
  const matchedSkills = skillsList.filter(s => text.includes(s));
  
  return {
    strict_filters: { campus: '', branch: '', batch: '' },
    scoring_filters: {
      skills_any: matchedSkills,
      interests_any: [],
      looking_for_any: []
    },
    status_any: 'any'
  };
}

async function postMatchmakerFilters(req, res) {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    if (!process.env.GROQ_API_KEY) {
      return res.json({ status: 'success', filters: extractFallbackFilters(prompt) });
    }

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
    const parsed = safeJsonParse(raw) || extractFallbackFilters(prompt);
    return res.json({ status: 'success', filters: parsed });
  } catch (e) {
    console.warn('Matchmaker filters fallback used:', e.message);
    return res.json({ status: 'success', filters: extractFallbackFilters(req.body?.prompt) });
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const cleanBase64 = String(image).replace(/^data:image\/\w+;base64,/, '');
        const prompt = `Act as a Gen Z college student. Write a caption that is ${instruction}. Rules: max 20 words, use emojis, NO visual description (don't say 'I see' or 'This is'), write as if you are in the photo or took it.`;
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
        ]);
        const caption = result.response.text().trim();
        return res.json({ status: 'success', style_used: instruction, caption });
      } catch (geminiErr) {
        console.warn('Gemini caption generation warning:', geminiErr.message);
      }
    }

    return res.json({
      status: 'success',
      style_used: instruction,
      caption: 'Making things happen on campus! 🚀✨ #CampusConnect #CampusLife',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Generate failed' });
  }
}

async function postChat(req, res) {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message is required' });

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        status: 'success',
        reply: 'Hi! CampusConnect AI is running locally. Connect with your peers, find teammates in Squads, or explore threads!',
      });
    }

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
    console.warn('AI chat fallback used:', e.message);
    return res.json({
      status: 'success',
      reply: 'Hi! CampusConnect assistant is running. Feel free to explore campus threads and squads!',
    });
  }
}

async function postDraft(req, res) {
  try {
    const context = String(req.body?.context || req.body?.prompt || '').trim();
    if (!context) return res.status(400).json({ error: 'context or prompt is required' });

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        status: 'success',
        text: `Excited to collaborate on ${context}! Looking forward to connecting with fellow campus members.`,
      });
    }

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

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        status: 'success',
        text: `Hey ${name}! Looking forward to teaming up on ${context || 'our project'}.`,
      });
    }

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
