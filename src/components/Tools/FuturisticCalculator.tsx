import React, { useState } from 'react';
import { Calculator as CalcIcon, Delete, RotateCcw, Copy, Check, History } from 'lucide-react';
import { AndroidIntentService } from '../../services/androidIntents';
import { VoiceService } from '../../services/voiceService';

export const FuturisticCalculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<Array<{ expr: string; res: string }>>([
    { expr: '250 * 1.16', res: '290' },
    { expr: 'sqrt(144) + 12', res: '24' },
  ]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleKeyPress = (val: string) => {
    VoiceService.playHologramTone('listening');
    AndroidIntentService.vibrate(25);

    if (val === 'C') {
      setExpression('');
      setResult('');
      return;
    }

    if (val === 'DEL') {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }

    if (val === '=') {
      calculateResult();
      return;
    }

    setExpression((prev) => prev + val);
  };

  const calculateResult = () => {
    if (!expression.trim()) return;
    try {
      // Safe sanitized math evaluation
      let sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/\^/g, '**');

      // Check allowed characters only
      if (!/^[0-9+\-*/().\s,Math.PIsqrtaincog]+$/.test(sanitized)) {
        throw new Error('Invalid math expression syntax');
      }

      // eslint-disable-next-line no-eval
      const evaluated = Function(`'use strict'; return (${sanitized})`)();
      const formatted = Number.isInteger(evaluated) ? String(evaluated) : Number(evaluated).toFixed(4).replace(/\.?0+$/, '');

      setResult(formatted);
      setHistory((prev) => [{ expr: expression, res: formatted }, ...prev.slice(0, 8)]);
      VoiceService.playHologramTone('confirm');
    } catch {
      setResult('SYNTAX ERROR');
      VoiceService.playHologramTone('alert');
    }
  };

  const copyResult = () => {
    if (result) {
      AndroidIntentService.copyToClipboard(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const buttons = [
    { label: 'C', val: 'C', style: 'text-red-400 bg-red-950/30 border-red-500/30' },
    { label: 'DEL', val: 'DEL', style: 'text-amber-400 bg-amber-950/30 border-amber-500/30' },
    { label: '(', val: '(', style: 'text-cyan-400 bg-slate-900/50' },
    { label: ')', val: ')', style: 'text-cyan-400 bg-slate-900/50' },

    { label: 'sin', val: 'sin(', style: 'text-purple-300 bg-purple-950/20' },
    { label: 'cos', val: 'cos(', style: 'text-purple-300 bg-purple-950/20' },
    { label: 'tan', val: 'tan(', style: 'text-purple-300 bg-purple-950/20' },
    { label: '÷', val: '÷', style: 'text-cyan-300 font-bold bg-cyan-950/40 border-cyan-500/40' },

    { label: '7', val: '7', style: 'text-white' },
    { label: '8', val: '8', style: 'text-white' },
    { label: '9', val: '9', style: 'text-white' },
    { label: '×', val: '×', style: 'text-cyan-300 font-bold bg-cyan-950/40 border-cyan-500/40' },

    { label: '4', val: '4', style: 'text-white' },
    { label: '5', val: '5', style: 'text-white' },
    { label: '6', val: '6', style: 'text-white' },
    { label: '-', val: '-', style: 'text-cyan-300 font-bold bg-cyan-950/40 border-cyan-500/40' },

    { label: '1', val: '1', style: 'text-white' },
    { label: '2', val: '2', style: 'text-white' },
    { label: '3', val: '3', style: 'text-white' },
    { label: '+', val: '+', style: 'text-cyan-300 font-bold bg-cyan-950/40 border-cyan-500/40' },

    { label: '0', val: '0', style: 'text-white' },
    { label: '.', val: '.', style: 'text-white' },
    { label: '√', val: 'sqrt(', style: 'text-cyan-300 bg-slate-900/50' },
    { label: '=', val: '=', style: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-lg shadow-lg shadow-cyan-500/30' },
  ];

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <CalcIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest">Neural Math Engine</span>
            <h3 className="text-base font-bold font-tech text-white">Quantum Calculator</h3>
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-xl border transition-all ${
            showHistory ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
          }`}
          title="Toggle History"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Screen Display */}
      <div className="bg-[#040916] border border-cyan-500/30 rounded-xl p-4 mb-4 text-right shadow-inner">
        <div className="text-xs font-mono text-cyan-400/80 h-5 overflow-x-auto whitespace-nowrap scrollbar-none">
          {expression || '0'}
        </div>
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={copyResult}
            disabled={!result}
            className="p-1 rounded text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30"
            title="Copy Result"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <div className="text-2xl font-bold font-hud text-white text-glow-cyan overflow-x-auto whitespace-nowrap">
            {result ? `= ${result}` : '—'}
          </div>
        </div>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="mb-4 p-3 rounded-xl bg-[#050B1B] border border-cyan-500/20 max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
          <div className="text-[10px] font-tech text-slate-400 uppercase">Recent Calculations</div>
          {history.length === 0 ? (
            <div className="text-slate-500 text-[11px]">No history logged yet.</div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setExpression(item.expr);
                  setResult(item.res);
                }}
                className="flex items-center justify-between p-1.5 rounded hover:bg-cyan-500/10 cursor-pointer text-slate-300 transition-colors"
              >
                <span>{item.expr}</span>
                <span className="font-bold text-cyan-300">= {item.res}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((b, i) => (
          <button
            key={i}
            onClick={() => handleKeyPress(b.val)}
            className={`py-3 px-2 rounded-xl border border-white/10 font-tech font-bold text-base transition-all active:scale-95 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 ${b.style}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
};
