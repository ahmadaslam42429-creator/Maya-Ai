import React, { useState } from 'react';
import { ChatMessage, AssistantAction } from '../../types/assistant';
import { Volume2, VolumeX, Copy, Check, Terminal, ExternalLink, Phone, Clock, Bell, Sparkles, Smile, Brain, Heart, HelpCircle, Activity, ShieldAlert } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isSpeaking: boolean;
  onExecuteAction: (action: AssistantAction) => void;
  onSelectSamplePrompt: (prompt: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isSpeaking,
  onExecuteAction,
  onSelectSamplePrompt,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const samplePrompts = [
    { label: 'اردو میں تعارف', text: 'اپنا تعارف کروائیں اور بتائیں کہ آپ کیا کر سکتی ہیں؟', lang: 'ur' },
    { label: 'Call Contact', text: 'Call Ahmad at +923001234567', lang: 'en' },
    { label: 'Set 7 AM Alarm', text: 'Set an alarm for 07:00 AM for morning exercise', lang: 'en' },
    { label: 'Weather Telemetry', text: 'What is the atmospheric weather report for Lahore?', lang: 'en' },
    { label: 'Hindi Greeting', text: 'नमस्ते माया, आज का दिन कैसा है?', lang: 'hi' },
    { label: 'Explain Quantum AI', text: 'Explain Quantum Computing and AI in simple terms', lang: 'en' },
  ];

  const handleCopyMessage = (id: string, text: string) => {
    AndroidIntentService.copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSpeakMessage = (id: string, text: string, lang?: string) => {
    if (currentlySpeakingId === id && isSpeaking) {
      VoiceService.stopSpeaking();
      setCurrentlySpeakingId(null);
      return;
    }

    setCurrentlySpeakingId(id);
    VoiceService.speak(text, {
      language: lang || (text.match(/[\u0600-\u06FF]/) ? 'ur' : text.match(/[\u0900-\u097F]/) ? 'hi' : 'en'),
      onEnd: () => setCurrentlySpeakingId(null),
    });
  };

  const getEmotionBadge = (emotion?: string) => {
    if (!emotion) return null;
    const map: Record<string, { label: string; icon: any; color: string }> = {
      happy: { label: 'Happy', icon: Smile, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' },
      thinking: { label: 'Analyzing', icon: Brain, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' },
      excited: { label: 'Excited', icon: Sparkles, color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' },
      caring: { label: 'Caring', icon: Heart, color: 'text-purple-400 border-purple-500/30 bg-purple-950/40' },
      confused: { label: 'Pondering', icon: HelpCircle, color: 'text-orange-400 border-orange-500/30 bg-orange-950/40' },
      serious: { label: 'Focused', icon: Activity, color: 'text-blue-400 border-blue-500/30 bg-blue-950/40' },
      sad: { label: 'Gentle', icon: ShieldAlert, color: 'text-sky-400 border-sky-500/30 bg-sky-950/40' },
    };
    const e = map[emotion] || map.happy;
    const Icon = e.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase border ${e.color}`}>
        <Icon className="w-3 h-3" />
        <span>{e.label}</span>
      </span>
    );
  };

  const isRTLText = (text: string) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const renderFormattedText = (text: string) => {
    // Check if contains code block
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const content = part.slice(3, -3).replace(/^[a-z]+\n/, '');
          return (
            <div key={index} className="my-2 rounded-xl bg-black/80 border border-cyan-500/30 p-3 font-mono text-xs text-cyan-300 overflow-x-auto relative group">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-cyan-500/20 text-[10px] text-slate-400 uppercase font-tech">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span>Synthesized Code Block</span>
                </span>
                <button
                  onClick={() => AndroidIntentService.copyToClipboard(content)}
                  className="hover:text-cyan-400 text-slate-400 text-[10px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
          );
        }
        return (
          <span key={index} className="whitespace-pre-line leading-relaxed">
            {part}
          </span>
        );
      });
    }

    return <span className="whitespace-pre-line leading-relaxed">{text}</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      {/* Sample Quick Prompt Chips */}
      {messages.length <= 1 && (
        <div className="p-4 rounded-2xl bg-[#060D1E]/90 border border-cyan-500/20 mb-4 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs font-hud text-cyan-400 uppercase tracking-widest mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended Vocal & Neural Queries</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSamplePrompt(s.text)}
                className="p-2.5 rounded-xl bg-[#08142E] hover:bg-cyan-950/50 border border-cyan-500/20 hover:border-cyan-400/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud text-cyan-400 uppercase">{s.label}</span>
                  <span className="text-[9px] font-mono text-slate-500">{s.lang.toUpperCase()}</span>
                </div>
                <div className={`text-xs text-slate-300 group-hover:text-white mt-1 ${s.lang === 'ur' ? 'font-urdu text-right text-sm' : 'font-tech'}`}>
                  "{s.text}"
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant';
        const isRTL = isRTLText(msg.text);

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} animate-fadeIn`}
          >
            {/* Sender and Emotion Header */}
            <div className="flex items-center gap-2 mb-1 text-[11px] font-tech text-slate-400 px-1">
              <span className="font-bold text-slate-300">
                {isAssistant ? 'AYRA AI' : 'Commander'}
              </span>
              <span>•</span>
              <span className="font-mono text-[10px] text-slate-500">{msg.timestamp}</span>
              {isAssistant && getEmotionBadge(msg.emotion)}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 text-xs shadow-lg transition-all ${
                isAssistant
                  ? 'bg-[#08142E]/95 border border-cyan-500/30 text-slate-100 rounded-tl-sm'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-tr-sm shadow-cyan-900/30'
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`text-sm ${isRTL ? 'font-urdu text-base leading-loose' : 'font-tech text-sm leading-relaxed'}`}>
                {renderFormattedText(msg.text)}
              </div>

              {/* Action Card Attachment if detected */}
              {msg.action && (
                <div className="mt-3 p-3 rounded-xl bg-[#040916] border border-cyan-500/40 text-left" dir="ltr">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      {msg.action.type === 'call' && <Phone className="w-3 h-3 text-emerald-400" />}
                      {msg.action.type === 'alarm' && <Clock className="w-3 h-3 text-amber-400" />}
                      {msg.action.type === 'reminder' && <Bell className="w-3 h-3 text-cyan-400" />}
                      <span>Action Detected: {msg.action.title}</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">Android Intent</span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-tech mb-2">
                    {msg.action.description}
                  </p>

                  <button
                    onClick={() => onExecuteAction(msg.action!)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Authorize & Execute Intent</span>
                  </button>
                </div>
              )}

              {/* Action Utilities (Audio / Copy) */}
              {isAssistant && (
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/5 text-slate-400" dir="ltr">
                  <button
                    onClick={() => handleSpeakMessage(msg.id, msg.text, msg.language)}
                    className={`p-1.5 rounded-lg hover:text-cyan-300 hover:bg-white/5 transition-colors ${
                      currentlySpeakingId === msg.id && isSpeaking ? 'text-cyan-400 animate-pulse' : ''
                    }`}
                    title={currentlySpeakingId === msg.id && isSpeaking ? 'Stop Audio' : 'Recite Spoken Audio'}
                  >
                    {currentlySpeakingId === msg.id && isSpeaking ? (
                      <VolumeX className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className="p-1.5 rounded-lg hover:text-cyan-300 hover:bg-white/5 transition-colors"
                    title="Copy Text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
