const GEMINI_KEY_STORAGE = 'ayra_gemini_api_key';
const GEMINI_MODEL = 'gemini-2.5-flash';

export function getGeminiApiKey(): string {
  try { return localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() || ''; } catch { return ''; }
}

export async function sendGeminiMessage(message: string, history: Array<{role:string; text:string}>, language: string) {
  const key = getGeminiApiKey();
  if (!key) throw new Error('Gemini API Key is missing. Open Settings > Gemini API Key and save your key.');
  const contents = [
    ...history.slice(-10).map(item => ({
      role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];
  const languageHint = language === 'ur' ? 'Reply in Urdu.' : language === 'hi' ? 'Reply in Hindi.' : language === 'auto' ? 'Reply in the same language as the user.' : 'Reply in English.';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `You are AYRA, a helpful multilingual personal AI assistant. ${languageHint} Be clear and conversational.` }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini request failed (${response.status})`);
  const reply = data?.candidates?.[0]?.content?.parts?.map((part:any) => part.text || '').join('').trim();
  if (!reply) throw new Error('Gemini returned an empty response. Check the API key and model access.');
  return { reply, emotion: 'happy', detectedLanguage: language === 'auto' ? 'en' : language, action: null };
}

export async function testGeminiApiKey(key: string): Promise<void> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key.trim())}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with exactly: AYRA connection successful.' }] }], generationConfig: { maxOutputTokens: 30 } })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini connection failed (${response.status})`);
}
