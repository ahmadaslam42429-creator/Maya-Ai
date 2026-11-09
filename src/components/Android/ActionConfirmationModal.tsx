import React from 'react';
import { AssistantAction } from '../../types/assistant';
import { Phone, Clock, Bell, ExternalLink, ShieldCheck, AlertTriangle, X, Check, Smartphone } from 'lucide-react';
import { AndroidIntentService } from '../../services/androidIntents';

interface ActionConfirmationModalProps {
  action: AssistantAction | null;
  onConfirm: (action: AssistantAction) => void;
  onCancel: () => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  if (!action) return null;

  const getActionIcon = () => {
    switch (action.type) {
      case 'call':
        return <Phone className="w-6 h-6 text-emerald-400" />;
      case 'alarm':
        return <Clock className="w-6 h-6 text-amber-400" />;
      case 'reminder':
        return <Bell className="w-6 h-6 text-cyan-400" />;
      case 'open_app':
        return <Smartphone className="w-6 h-6 text-purple-400" />;
      case 'open_url':
      case 'search':
        return <ExternalLink className="w-6 h-6 text-blue-400" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getTargetIntentSummary = () => {
    switch (action.type) {
      case 'call':
        return `Target Phone Number: ${action.payload?.number || 'Specified Contact'}`;
      case 'alarm':
        return `Alarm Time: ${action.payload?.time || 'Scheduled Time'} (${action.payload?.label || 'MAYA Wakeup'})`;
      case 'reminder':
        return `Reminder: "${action.payload?.title || action.title}" at ${action.payload?.time || 'Scheduled'}`;
      case 'open_app':
        return `Target Application: ${action.payload?.appName || 'System App'}`;
      case 'open_url':
        return `Destination URL: ${action.payload?.url || 'External Target'}`;
      case 'search':
        return `Query: "${action.payload?.query || ''}"`;
      default:
        return JSON.stringify(action.payload || {});
    }
  };

  const handleExecute = () => {
    AndroidIntentService.vibrate(80);
    onConfirm(action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#08132B] border-2 border-cyan-500/50 rounded-2xl p-6 shadow-2xl shadow-cyan-900/40 text-slate-100 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />
        <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/30">
            {getActionIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-hud text-cyan-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android Intent Protocol</span>
            </div>
            <h3 className="text-lg font-bold font-tech text-white tracking-wide">
              {action.title}
            </h3>
          </div>
        </div>

        {/* Action Description */}
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          {action.description || 'MAYA is requesting authorization to launch a native Android subsystem intent.'}
        </p>

        {/* Intent Details Box */}
        <div className="bg-[#050B18] border border-cyan-500/30 rounded-xl p-3.5 mb-5 font-mono text-xs text-cyan-300/90 break-all space-y-1">
          <div className="text-[10px] uppercase font-tech text-slate-400 tracking-wider">Parameters:</div>
          <div className="text-cyan-200 font-semibold">{getTargetIntentSummary()}</div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
            Security: Handled via standard Android Intent Filter & OS confirmation.
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Sensitive action safety rule: Execution passes control to your native Android system dialer or target intent receiver.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-tech font-semibold text-sm transition-all"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleExecute}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-sm shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
          >
            <Check className="w-4 h-4 text-slate-950" />
            <span>Confirm & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
