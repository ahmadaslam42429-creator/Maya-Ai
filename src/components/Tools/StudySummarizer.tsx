import React, { useState } from 'react';
import { BookOpen, FileText, Upload, Sparkles, Volume2, Copy, Check, Clock, Brain } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';

export const StudySummarizer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [targetFormat, setTargetFormat] = useState<'bullet_points' | 'executive' | 'study_cards'>('bullet_points');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary?: string;
    keyPoints?: string[];
    readingTime?: string;
    actionableTakeaways?: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTexts = [
    {
      title: 'Quantum Computing',
      text: `Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers. Classical computers encode information in binary bits (0s and 1s). Quantum computers, however, use qubits, which can exist in a superposition of both states simultaneously. Furthermore, quantum entanglement allows qubits separated by vast distances to interact instantaneously. Key applications include post-quantum cryptography, molecular drug simulation, financial portfolio optimization, and climate modeling. Major engineering challenges include decoherence, error mitigation, and cryogenic cooling requirements.`,
    },
    {
      title: 'Neural Networks & AI',
      text: `Artificial Neural Networks are computational systems loosely inspired by biological brains. Consisting of interconnected layers of artificial neurons, these models process complex data through forward propagation and adjust internal weights via backpropagation and gradient descent. Modern architectures, particularly the Transformer with its self-attention mechanism, revolutionized Natural Language Processing and computer vision. Scaling laws have shown predictable capability gains with increased parameter count, training tokens, and compute budgets. Current frontiers include multimodal grounding, reasoning tokens, and energy-efficient edge deployment.`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetFormat,
          language: 'English',
        }),
      });
      const data = await res.json();
      setResult(data);
      VoiceService.playHologramTone('confirm');
    } catch (err) {
      console.warn('Backend unavailable, using local synthesis fallback:', err);
      const sentences = inputText.split(/(?<=[.?!])\s+/).filter(Boolean);
      setResult({
        summary: sentences.slice(0, 3).join(' ') || inputText.slice(0, 280) + '...',
        keyPoints: (sentences.length > 3 ? sentences.slice(0, 4) : [inputText.slice(0, 100)]).map((s) => s.trim()),
        readingTime: `${Math.max(1, Math.ceil(inputText.split(/\s+/).length / 200))} min read`,
        actionableTakeaways: ['Review core principles', 'Synthesize key insights into practice'],
      });
      VoiceService.playHologramTone('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakSummary = () => {
    if (!result?.summary) return;
    VoiceService.speak(result.summary);
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `${result.summary || ''}\n\nKey Points:\n${(result.keyPoints || []).map((k) => `• ${k}`).join('\n')}`;
    AndroidIntentService.copyToClipboard(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest">Cognitive Synthesizer</span>
            <h3 className="text-base font-bold font-tech text-white">Study & Document Intelligence</h3>
          </div>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1 bg-[#050A17] p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setTargetFormat('bullet_points')}
            className={`px-2.5 py-1 rounded-lg font-tech transition-all ${
              targetFormat === 'bullet_points' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Key Bullets
          </button>
          <button
            onClick={() => setTargetFormat('executive')}
            className={`px-2.5 py-1 rounded-lg font-tech transition-all ${
              targetFormat === 'executive' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Executive Summary
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-tech">
          <span>Source Document / Text</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-cyan-400 cursor-pointer hover:underline">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .txt/.md</span>
              <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
            </label>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-500">{inputText.length} chars</span>
          </div>
        </div>

        <textarea
          rows={5}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste complex text, lecture notes, academic paper, or long message here for MAYA to synthesize..."
          className="w-full bg-[#050B1B] border border-cyan-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-tech leading-relaxed resize-none"
        />

        {/* Quick Sample Chips */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-slate-500 uppercase font-hud">Try Samples:</span>
          {sampleTexts.map((s, i) => (
            <button
              key={i}
              onClick={() => setInputText(s.text)}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-900/40 text-cyan-300 border border-white/5 transition-colors font-tech"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Synthesize Button */}
      <button
        onClick={handleSummarize}
        disabled={loading || !inputText.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 active:scale-98"
      >
        <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Synthesizing with Gemini Neural Core...' : 'Generate AI Summary & Insights'}</span>
      </button>

      {/* Results View */}
      {result && (
        <div className="mt-5 p-4 rounded-xl bg-[#050B1B] border border-cyan-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2 text-xs font-tech text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{result.readingTime || 'Time saved: ~4 min'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeakSummary}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-tech border border-cyan-500/30 transition-colors"
                title="Speak Summary"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speak</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-tech border border-white/10 transition-colors"
                title="Copy Content"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {result.summary && (
            <div>
              <div className="text-[10px] uppercase font-hud text-cyan-400 mb-1">Executive Summary</div>
              <p className="text-xs text-slate-200 leading-relaxed font-tech">
                {result.summary}
              </p>
            </div>
          )}

          {result.keyPoints && result.keyPoints.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-hud text-cyan-400 mb-2">Key Takeaways & Findings</div>
              <ul className="space-y-1.5 text-xs text-slate-200 font-tech">
                {result.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
