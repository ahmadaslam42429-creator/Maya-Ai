import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Volume2, Copy, Check, Sparkles, Globe } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';

export const NeuralTranslator: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Urdu');
  const [inputText, setInputText] = useState('Hello! I am Maya, your futuristic personal AI assistant. How may I assist you today?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    translatedText: string;
    pronunciation?: string;
    sourceDetected?: string;
  } | null>({
    translatedText: 'ہیلو! میں مایا ہوں، آپ کی مستقبل کی ذاتی اے آئی اسسٹنٹ۔ آج میں آپ کی کس طرح مدد کر سکتی ہوں؟',
    pronunciation: 'Hello! Main Maya hoon, aap ki mustaqbil ki zaati AI assistant. Aaj main aap ki kis tarah madad kar sakti hoon?',
    sourceDetected: 'English',
  });
  const [copied, setCopied] = useState(false);

  const availableLanguages = [
    { name: 'English', code: 'en' },
    { name: 'Urdu', code: 'ur', script: 'اردو' },
    { name: 'Hindi', code: 'hi', script: 'हिन्दी' },
    { name: 'Arabic', code: 'ar', script: 'العربية' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Chinese', code: 'zh' },
    { name: 'Japanese', code: 'ja' },
  ];

  const handleSwap = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (result?.translatedText) {
      setInputText(result.translatedText);
      setResult(null);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
        }),
      });
      const data = await res.json();
      setResult(data);
      VoiceService.playHologramTone('confirm');
    } catch (err) {
      console.error(err);
      VoiceService.playHologramTone('alert');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string, langName: string) => {
    let langCode = 'en';
    if (langName.toLowerCase().includes('urdu')) langCode = 'ur';
    else if (langName.toLowerCase().includes('hindi')) langCode = 'hi';
    else if (langName.toLowerCase().includes('arabic')) langCode = 'ar';
    else if (langName.toLowerCase().includes('spanish')) langCode = 'es';

    VoiceService.speak(text, { language: langCode });
  };

  const handleCopy = () => {
    if (!result?.translatedText) return;
    AndroidIntentService.copyToClipboard(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest">Polyglot Neural Matrix</span>
            <h3 className="text-base font-bold font-tech text-white">Universal Language Translator</h3>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-hud text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-500/30">
          <Globe className="w-3.5 h-3.5" />
          <span>URDU • ENGLISH • HINDI</span>
        </div>
      </div>

      {/* Language Bar */}
      <div className="grid grid-cols-5 items-center gap-2 mb-4 bg-[#050A17] p-2 rounded-xl border border-white/10">
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="col-span-2 bg-[#09142E] text-white text-xs font-tech rounded-lg p-2 border border-cyan-500/30 outline-none"
        >
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.name}>
              {l.name} {l.script ? `(${l.script})` : ''}
            </option>
          ))}
        </select>

        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-600/30 text-cyan-400 transition-colors border border-white/10"
            title="Swap Languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="col-span-2 bg-[#09142E] text-white text-xs font-tech rounded-lg p-2 border border-cyan-500/30 outline-none"
        >
          {availableLanguages.map((l) => (
            <option key={l.code} value={l.name}>
              {l.name} {l.script ? `(${l.script})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Input Box */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-tech">
          <span>Source Input ({sourceLang})</span>
          <button
            onClick={() => handleSpeak(inputText, sourceLang)}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
          >
            <Volume2 className="w-3 h-3" />
            <span>Listen</span>
          </button>
        </div>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate..."
          className={`w-full bg-[#050B1B] border border-cyan-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 leading-relaxed resize-none ${
            sourceLang === 'Urdu' || sourceLang === 'Arabic' ? 'font-urdu text-right text-sm' : 'font-tech'
          }`}
          dir={sourceLang === 'Urdu' || sourceLang === 'Arabic' ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Translate Action Button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 active:scale-98"
      >
        <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Translating with Neural Engine...' : `Translate to ${targetLang}`}</span>
      </button>

      {/* Output Card */}
      {result && (
        <div className="mt-4 p-4 rounded-xl bg-[#050B1B] border border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
            <span className="text-[10px] uppercase font-hud text-cyan-400">
              {targetLang} Translation
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeak(result.translatedText, targetLang)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-tech border border-cyan-500/30 transition-colors"
                title="Pronounce Translation"
              >
                <Volume2 className="w-3 h-3" />
                <span>Speak</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-tech border border-white/10 transition-colors"
                title="Copy Translation"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div
            className={`text-white leading-relaxed ${
              targetLang === 'Urdu' || targetLang === 'Arabic'
                ? 'font-urdu text-right text-base text-cyan-200'
                : 'font-tech text-sm text-cyan-100'
            }`}
            dir={targetLang === 'Urdu' || targetLang === 'Arabic' ? 'rtl' : 'ltr'}
          >
            {result.translatedText}
          </div>

          {result.pronunciation && (
            <div className="mt-2.5 pt-2 border-t border-white/5 text-xs text-slate-400 font-tech">
              <span className="text-[10px] text-cyan-400/80 uppercase font-hud block">Roman / Phonetic:</span>
              <span className="italic text-slate-300">{result.pronunciation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
