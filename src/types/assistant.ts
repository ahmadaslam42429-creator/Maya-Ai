export type EmotionType = 
  | 'happy' 
  | 'thinking' 
  | 'excited' 
  | 'caring' 
  | 'confused' 
  | 'serious' 
  | 'sad';

export type LanguageCode = 'en' | 'ur' | 'hi' | 'auto';

export interface AssistantAction {
  type: 'call' | 'alarm' | 'reminder' | 'open_app' | 'open_url' | 'weather' | 'calculator' | 'note' | 'search' | 'share';
  title: string;
  description: string;
  payload: Record<string, any>;
  requiresConfirmation: boolean;
  status?: 'pending' | 'executed' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  emotion?: EmotionType;
  timestamp: string;
  language?: string;
  action?: AssistantAction | null;
  audioPlayed?: boolean;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: 'preference' | 'personal' | 'fact' | 'work' | 'general';
  createdAt: string;
  isFavorite?: boolean;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  color?: string;
}

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI: string;
  wakeWordEnabled: boolean;
  autoSpeak: boolean;
  language: LanguageCode;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  createdAt: string;
}

export type AvatarPose = 'sit' | 'stand' | 'talk' | 'idle' | 'wave' | 'think';
export type AvatarPosition = 'left' | 'center' | 'right';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'hero';
export type AvatarFraming = 'upper' | 'full';

export interface AvatarSettings {
  pose: AvatarPose;
  position: AvatarPosition;
  size: AvatarSize;
  framing: AvatarFraming;
  visible: boolean;
  quality: 'ultra' | 'high' | 'balanced';
  lipSyncEnabled: boolean;
  showHoloDesk: boolean;
}

export interface VisionAnalysisResult {
  reply: string;
  detectedObjects: string[];
  textRecognized: string;
  sceneType?: string;
  actionRecommendation?: string;
  imageUrl?: string;
  timestamp: string;
}

export interface LiveSearchResult {
  query: string;
  summary: string;
  sources: Array<{ title: string; url: string }>;
  webSearchQueries?: string[];
  verified: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  systemInstruction?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  historyIndex: number;
}

export interface BrowserBookmark {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  category?: string;
}

export interface BrowserHistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: string;
}
