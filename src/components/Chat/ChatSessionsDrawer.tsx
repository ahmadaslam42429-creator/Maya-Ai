/**
 * AYRA AI — Multi-Session Chat Manager Drawer
 * Allows users to create new chats, rename chats, delete chats,
 * and switch between independent conversation threads.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { ChatSession } from '../../types/assistant';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ChatSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const ChatSessionsDrawer: React.FC<ChatSessionsDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert('You must keep at least one conversation session.');
      return;
    }
    onDeleteSession(sessionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-xs sm:max-w-sm h-full bg-[#050C1D] border-r border-cyan-500/30 flex flex-col p-4 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="font-hud font-bold text-sm text-white">Conversation Vault</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onCreateSession();
            onClose();
          }}
          className="my-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectSession(session.id);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-900/30'
                    : 'bg-black/30 border-white/5 hover:border-cyan-500/30 hover:bg-white/5'
                }`}
              >
                <div className="flex-1 min-w-0 mr-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-400 rounded-lg px-2 py-1 text-xs font-tech text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveRename(session.id, e)}
                        className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 hover:bg-red-500/20 text-slate-400 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-xs font-tech font-bold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-cyan-300'}`}>
                        {session.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{session.updatedAt || session.createdAt}</span>
                        <span>•</span>
                        <span>{session.messages.length} msgs</span>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(session, e)}
                      className="p-1 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 rounded transition-colors"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 text-[10px] font-tech text-slate-500 text-center">
          AYRA AI Quantum Memory Matrix • Encrypted Offline
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
