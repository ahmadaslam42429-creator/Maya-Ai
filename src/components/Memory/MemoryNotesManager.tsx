import React, { useState, useEffect } from 'react';
import { MemoryItem, UserNote } from '../../types/assistant';
import { Brain, Bookmark, Search, Plus, Trash2, Edit3, Save, X, Download, ShieldCheck, Tag } from 'lucide-react';
import { AndroidIntentService } from '../../services/androidIntents';
import { VoiceService } from '../../services/voiceService';

export const MemoryNotesManager: React.FC<{
  onClearHistory?: () => void;
}> = ({ onClearHistory }) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'notes'>('memory');
  const [searchQuery, setSearchQuery] = useState('');

  // Memory items state
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('maya_memory_bank');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'mem-1',
        title: 'User Identity & Preferred Name',
        content: 'Prefers to be addressed respectfully as Boss / Ahmad with concise answers.',
        category: 'preference',
        createdAt: '2026-11-08 09:00',
        isFavorite: true,
      },
      {
        id: 'mem-2',
        title: 'Primary Language Preference',
        content: 'Bilingual in English and Urdu. Prefers Urdu audio greetings in the morning.',
        category: 'preference',
        createdAt: '2026-11-08 10:30',
        isFavorite: true,
      },
      {
        id: 'mem-3',
        title: 'Project Focus',
        content: 'Developing AYRA AI personal assistant Android ecosystem with Gemini.',
        category: 'work',
        createdAt: '2026-11-08 14:15',
        isFavorite: false,
      },
    ];
  });

  // User notes state
  const [notes, setNotes] = useState<UserNote[]>(() => {
    try {
      const saved = localStorage.getItem('ayra_user_notes') || localStorage.getItem('maya_user_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'note-1',
        title: 'AYRA Android Architecture',
        content: 'Remember to verify Android Intent Filter for tel: and speech recognition audio focus before building APK in Android Studio.',
        tags: ['Android', 'Architecture', 'Gemini'],
        createdAt: '2026-11-08 11:20',
        color: '#00F0FF',
      },
      {
        id: 'note-2',
        title: 'Grocery & Hardware Checklist',
        content: '1. USB-C debugging cable\n2. External test microphone\n3. Android 14 test device',
        tags: ['Personal', 'Hardware'],
        createdAt: '2026-11-08 16:45',
        color: '#9D4EDD',
      },
    ];
  });

  // Editor modal state
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form fields for adding
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'preference' | 'personal' | 'fact' | 'work' | 'general'>('preference');
  const [newTags, setNewTags] = useState('Android, AI');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('maya_memory_bank', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('maya_user_notes', JSON.stringify(notes));
  }, [notes]);

  const handleDeleteMemory = (id: string) => {
    AndroidIntentService.vibrate(30);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    VoiceService.playHologramTone('alert');
  };

  const handleDeleteNote = (id: string) => {
    AndroidIntentService.vibrate(30);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    VoiceService.playHologramTone('alert');
  };

  const handleSaveNew = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    if (activeTab === 'memory') {
      const item: MemoryItem = {
        id: `mem-${Date.now()}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        createdAt: new Date().toLocaleString(),
        isFavorite: false,
      };
      setMemories((prev) => [item, ...prev]);
    } else {
      const tagList = newTags.split(',').map((t) => t.trim()).filter(Boolean);
      const item: UserNote = {
        id: `note-${Date.now()}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: tagList,
        createdAt: new Date().toLocaleString(),
        color: '#00F0FF',
      };
      setNotes((prev) => [item, ...prev]);
    }

    VoiceService.playHologramTone('confirm');
    setNewTitle('');
    setNewContent('');
    setIsAddingNew(false);
  };

  const handleExportBackup = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      assistant: 'AYRA AI',
      memories,
      notes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maya_memory_vault_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    VoiceService.playHologramTone('confirm');
  };

  const filteredMemories = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-hud text-cyan-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Client Encrypted Vault</span>
            </div>
            <h3 className="text-base font-bold font-tech text-white">Memory & Notes System</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-tech text-xs border border-white/10 transition-colors"
            title="Download JSON Memory Vault"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Vault</span>
          </button>

          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{activeTab === 'memory' ? 'Add Memory' : 'Create Note'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 bg-[#050A17] p-1 rounded-xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all ${
              activeTab === 'memory'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Bank ({memories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all ${
              activeTab === 'notes'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Notes & Scratchpad ({notes.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#050A17] border border-cyan-500/20 rounded-xl px-3 py-1.5 flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'memory' ? 'memories' : 'notes'}...`}
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-tech"
          />
        </div>
      </div>

      {/* Add New Item Form Overlay */}
      {isAddingNew && (
        <div className="mb-4 p-4 rounded-xl bg-[#050B1B] border border-cyan-400/40 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-hud text-cyan-300 uppercase">
              Add {activeTab === 'memory' ? 'Memory Record' : 'Personal Note'}
            </h4>
            <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title or Summary..."
              className="w-full bg-[#08122B] border border-cyan-500/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none font-tech"
            />

            <textarea
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Detail content to store..."
              className="w-full bg-[#08122B] border border-cyan-500/30 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none font-tech resize-none leading-relaxed"
            />

            {activeTab === 'memory' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-tech">Category:</span>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="bg-[#08122B] text-white text-xs font-tech rounded-lg p-1.5 border border-cyan-500/30 outline-none"
                >
                  <option value="preference">Preference</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work & Projects</option>
                  <option value="fact">Fact / Knowledge</option>
                  <option value="general">General</option>
                </select>
              </div>
            ) : (
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma separated, e.g. Ideas, Android)..."
                className="w-full bg-[#08122B] border border-cyan-500/30 rounded-lg p-2 text-xs text-white placeholder-slate-500 outline-none font-tech"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs font-tech"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNew}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-tech font-bold text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {activeTab === 'memory' ? (
          filteredMemories.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-tech">
              No matching memory records located in neural vault.
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-[#050B1B]/80 border border-cyan-500/20 hover:border-cyan-400/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-hud uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {m.category}
                    </span>
                    <h4 className="text-xs font-bold font-tech text-white">{m.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-tech">{m.content}</p>
                <div className="mt-2 text-[10px] text-slate-500 font-mono">{m.createdAt}</div>
              </div>
            ))
          )
        ) : filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-tech">
            No notes found. Create your first note above!
          </div>
        ) : (
          filteredNotes.map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl bg-[#050B1B]/80 border border-purple-500/20 hover:border-purple-400/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-xs font-bold font-tech text-white">{n.title}</h4>
                <button
                  onClick={() => handleDeleteNote(n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/20 transition-all"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-tech whitespace-pre-line">{n.content}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 flex-wrap">
                  {n.tags.map((t, idx) => (
                    <span key={idx} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-tech">
                      <Tag className="w-2.5 h-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{n.createdAt}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Danger Controls */}
      <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs text-slate-400">
        <span>Zero sensitive data is persisted outside your device.</span>
        {onClearHistory && (
          <button
            onClick={() => {
              if (window.confirm('Erase all chat conversation history and reset neural context?')) {
                onClearHistory();
              }
            }}
            className="text-red-400 hover:text-red-300 font-tech text-xs underline"
          >
            Clear Conversation Stream
          </button>
        )}
      </div>
    </div>
  );
};
