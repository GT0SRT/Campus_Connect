import { fileToBase64 } from "./cloudinaryService";
import api from "./api";

export async function generateCaptionFromImageFile(file, instruction = "") {
  try {
    const base64 = await fileToBase64(file);
    const res = await api.post('/ai/generate', { image: base64, instruction });
    return res.data?.caption || "";
  } catch (err) {
    console.warn("Caption generation failed, using fallback:", err);
    return "Making things happen on campus! 🚀✨ #CampusConnect";
  }
}

export async function chatWithGemini(message) {
  try {
    const res = await api.post('/ai/chat', { message });
    return res.data?.reply || 'CampusConnect AI is ready! Connect with peers and collaborate.';
  } catch (err) {
    console.warn("Chat failed, using fallback:", err);
    return 'CampusConnect AI is running locally. Connect with peers, explore squads, and discuss in threads!';
  }
}

export async function aiDraft(context) {
  try {
    const res = await api.post('/ai/draft', { context });
    return res.data?.text || '';
  } catch (err) {
    console.warn("Draft failed:", err);
    return `Excited to collaborate on ${context}! Looking forward to connecting with fellow campus members.`;
  }
}

export async function aiIcebreaker(name, context) {
  try {
    const res = await api.post('/ai/icebreaker', { name, context });
    return res.data?.text || '';
  } catch (err) {
    console.warn("Icebreaker failed:", err);
    return `Hey ${name}! Looking forward to teaming up on ${context || 'our project'}.`;
  }
}
