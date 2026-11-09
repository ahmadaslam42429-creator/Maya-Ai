import React, { useState } from 'react';
import { Send, Mic, MicOff, Square, Globe } from 'lucide-react';
import { LanguageCode } from '../../types/assistant';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  interimTranscript?: string;
  activeLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  isListening,
  isSpeaking,
  onToggleListening,
  onStopSpeaking,
  interimTranscript = '',
  activeLanguage,
  onLanguageChange,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const textToSend = inputText.trim() || interimTranscript.trim();
    if (!textToSend || disabled) return;

    onSendMessage(textToSend);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cycleLanguage = () => {
    if (activeLanguage === 'en') onLanguageChange('ur');
    else if (activeLanguage === 'ur') onLanguageChange('hi');
    else onLanguageChange('en');
  };

  return (
    <div className="w-full relative">
      {/* Live Interim Speech Bubble */}
      {isListening && (
        <div className="absolute -top-11 left-0 right-0 flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-xs text-cyan-200 font-tech shadow-lg backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="truncate">
              {interimTranscript ? `"${interimTranscript}"` : 'Listening for transmission... Speak clearly into microphone'}
            </span>
          </div>
          <button
            onClick={onToggleListening}
            className="text-[10px] uppercase font-hud text-red-400 hover:text-red-300 ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 bg-[#060D1F]/90 border border-cyan-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-lg focus-within:border-cyan-400 transition-all"
      >
        {/* Language switch button */}
        <button
          type="button"
          onClick={cycleLanguage}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#091530] hover:bg-cyan-950 border border-cyan-500/20 text-cyan-300 text-xs font-tech font-bold transition-colors shrink-0"
          title="Cycle Language (EN / UR / HI)"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase">{activeLanguage === 'ur' ? 'اردو' : activeLanguage === 'hi' ? 'हिन्दी' : 'EN'}</span>
        </button>

        {/* Input Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            activeLanguage === 'ur'
              ? 'آئرا سے کچھ بھی پوچھیں، یا مائیک دبائیں...'
              : activeLanguage === 'hi'
              ? 'आयरा से कुछ भी पूछें, या माइक दबाएं...'
              : 'Transmit command to AYRA AI, or tap microphone...'
          }
          className={`flex-1 bg-transparent px-2 text-sm text-white placeholder-slate-500 outline-none ${
            activeLanguage === 'ur' ? 'font-urdu text-right text-base' : 'font-tech'
          }`}
          dir={activeLanguage === 'ur' ? 'rtl' : 'ltr'}
        />

        {/* Stop Speaking Button if currently speaking */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="p-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-tech text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all animate-pulse shrink-0"
            title="Stop Assistant Speech"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Mute</span>
          </button>
        )}

        {/* Microphone Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
          }`}
          title={isListening ? 'Stop Listening' : 'Activate Voice Recognition'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputText.trim() && !interimTranscript.trim()) || disabled}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shrink-0"
          title="Send Transmission"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
