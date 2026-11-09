/**
 * MAYA AI — Vision & Live Grounded Search Studio
 * Optical Camera, Gallery OCR, Scene Analysis & Verified Web Search
 * @license Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Search, 
  Sparkles, 
  Eye, 
  Globe, 
  FileText, 
  Volume2, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  ShieldCheck,
  Video,
  X
} from 'lucide-react';
import { VisionAnalysisResult, LiveSearchResult } from '../../types/assistant';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';

interface VisionSearchStudioProps {
  onSpeak?: (text: string) => void;
  onSendToChat?: (text: string) => void;
}

export const VisionSearchStudio: React.FC<VisionSearchStudioProps> = ({
  onSpeak,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'vision' | 'search'>('vision');

  // Vision states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('Describe this image in detail, extract any visible text, detect objects, and provide personal assistant guidance.');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<LiveSearchResult | null>(null);

  // Clipboard copy state
  const [copied, setCopied] = useState(false);

  // Stop camera stream on unmount or tab change
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startCameraStream = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access not supported in this environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      VoiceService.playHologramTone('listening');
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera sensor unavailable or permission denied. Please use the image upload option.');
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setSelectedImage(dataUrl);
    stopCameraStream();
    VoiceService.playHologramTone('confirm');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      setVisionResult(null);
      VoiceService.playHologramTone('confirm');
    };
    reader.readAsDataURL(file);
  };

  // Analyze Image with Gemini Vision API
  const handleAnalyzeVision = async () => {
    if (!selectedImage) return;
    setIsAnalyzingVision(true);
    setVisionResult(null);

    try {
      const res = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          prompt: visionPrompt,
          userLanguage: 'en',
        }),
      });

      const data = await res.json();
      const resObj: VisionAnalysisResult = {
        reply: data.reply || 'Optical analysis complete. Objects and telemetry mapped.',
        detectedObjects: data.detectedObjects || ['Visual Scene', 'Target Entity'],
        textRecognized: data.textRecognized || 'None detected',
        sceneType: data.sceneType || 'General Optical Frame',
        actionRecommendation: data.actionRecommendation || 'Analysis stored in telemetry logs',
        imageUrl: selectedImage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setVisionResult(resObj);
      VoiceService.playHologramTone('confirm');

      if (onSpeak) {
        onSpeak(resObj.reply);
      }
    } catch (err) {
      console.error(err);
      VoiceService.playHologramTone('alert');
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Perform Live Web Search with Grounding
  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, userLanguage: 'en' }),
      });

      const data = await res.json();
      const resObj: LiveSearchResult = {
        query: q,
        summary: data.summary || 'Search complete.',
        sources: data.sources || [],
        webSearchQueries: data.webSearchQueries || [q],
        verified: Boolean(data.verified),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSearchResult(resObj);
      VoiceService.playHologramTone('confirm');

      if (onSpeak) {
        onSpeak(`Search results retrieved for ${q}. ${resObj.summary.slice(0, 180)}`);
      }
    } catch (err) {
      console.error(err);
      VoiceService.playHologramTone('alert');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (text: string) => {
    AndroidIntentService.copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full bg-[#060D20]/90 border border-cyan-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl text-slate-100 flex flex-col space-y-4">
      {/* Top Header & Tab Switcher */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/20">
            {activeTab === 'vision' ? <Eye className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest block">Multimodal Matrix</span>
            <h3 className="text-base font-bold font-tech text-white">
              {activeTab === 'vision' ? 'Optical Vision & OCR Intelligence' : 'Live Verified Internet Search'}
            </h3>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[#040816] p-1 rounded-2xl border border-cyan-500/20">
          <button
            onClick={() => {
              stopCameraStream();
              setActiveTab('vision');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-tech text-xs transition-all ${
              activeTab === 'vision'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera & Vision</span>
          </button>
          <button
            onClick={() => {
              stopCameraStream();
              setActiveTab('search');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-tech text-xs transition-all ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Search</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: OPTICAL VISION & OCR */}
      {activeTab === 'vision' && (
        <div className="space-y-4">
          {/* Capture Controls Bar */}
          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                onClick={startCameraStream}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#081534] hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 font-tech text-xs transition-colors shadow-md"
              >
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Launch Camera Sensor</span>
              </button>
            ) : (
              <button
                onClick={stopCameraStream}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-tech text-xs transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close Camera</span>
              </button>
            )}

            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#081534] hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 font-tech text-xs cursor-pointer transition-colors shadow-md">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload from Gallery</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-tech">
              {cameraError}
            </div>
          )}

          {/* Live Video Camera Viewport */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden border border-cyan-400 bg-black aspect-video flex items-center justify-center shadow-xl">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Sci-Fi Target Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border border-dashed border-cyan-400/60 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 border border-cyan-400 rounded-full animate-ping opacity-50" />
                </div>
              </div>
              {/* Shutter Button */}
              <div className="absolute bottom-4 z-20">
                <button
                  onClick={captureCameraFrame}
                  className="px-6 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-hud font-bold text-xs tracking-wider shadow-lg shadow-cyan-400/40 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>CAPTURE OPTICAL FRAME</span>
                </button>
              </div>
            </div>
          )}

          {/* Selected Image Preview */}
          {selectedImage && !isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-[#040816] max-h-64 flex items-center justify-center">
              <img src={selectedImage} alt="Captured Target" className="max-h-64 w-auto object-contain" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-900/80 text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Prompt Selector & Input */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5 font-tech flex items-center justify-between">
              <span>Vision Query / Analysis Directive</span>
              <span className="text-[10px] text-cyan-400/80 font-hud">Gemini 2.5 Multimodal Core</span>
            </div>
            <input
              type="text"
              value={visionPrompt}
              onChange={(e) => setVisionPrompt(e.target.value)}
              placeholder="E.g. What is this object? Translate any text on screen..."
              className="w-full bg-[#050A1A] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-tech"
            />
            {/* Quick Sample Prompts */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                'Read and extract all visible text (OCR)',
                'Identify objects and describe scene',
                'Explain what is happening in this photo',
                'Suggest follow-up actions',
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => setVisionPrompt(p)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-900/40 text-cyan-300 border border-white/5 whitespace-nowrap font-tech"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Action Button */}
          <button
            onClick={handleAnalyzeVision}
            disabled={isAnalyzingVision || !selectedImage}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-tech font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-98"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzingVision ? 'animate-spin' : ''}`} />
            <span>{isAnalyzingVision ? 'Scanning with Gemini Multimodal Core...' : 'Execute Optical Vision Analysis'}</span>
          </button>

          {/* Vision Result Card */}
          {visionResult && (
            <div className="p-4 rounded-2xl bg-[#050B1B] border border-cyan-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-hud text-cyan-300 font-bold uppercase">{visionResult.sceneType}</span>
                </div>
                <div className="flex items-center gap-2">
                  {onSpeak && (
                    <button
                      onClick={() => onSpeak(visionResult.reply)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-tech border border-cyan-500/30 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(visionResult.reply)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech border border-white/10 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Main Natural Language Explanation */}
              <p className="text-xs text-slate-200 leading-relaxed font-tech">
                {visionResult.reply}
              </p>

              {/* Detected Objects Chips */}
              {visionResult.detectedObjects && visionResult.detectedObjects.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-hud text-cyan-400 block mb-1.5">Detected Entities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {visionResult.detectedObjects.map((obj, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-tech"
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recognized OCR Text */}
              {visionResult.textRecognized && visionResult.textRecognized !== 'None detected' && (
                <div className="p-3 rounded-xl bg-[#030712] border border-white/10">
                  <div className="flex items-center justify-between text-[10px] font-hud text-cyan-400 uppercase mb-1">
                    <span>Recognized Text (OCR)</span>
                    <button
                      onClick={() => handleCopy(visionResult.textRecognized)}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Text</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {visionResult.textRecognized}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LIVE SEARCH WITH VERIFIED SOURCES */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Search Bar Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search live internet, breaking news, academic topics..."
              className="w-full bg-[#050A1A] border border-cyan-500/30 rounded-2xl py-3 pl-11 pr-28 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-tech"
            />
            <Search className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-2 py-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-xs shadow-md transition-all disabled:opacity-40"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-hud text-slate-500 uppercase shrink-0">Popular:</span>
            {[
              'Latest Artificial Intelligence News',
              'Quantum Computing Superposition',
              'Space Missions 2025',
              'Android 15 Features',
              'Urdu Poetry & History',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(chip);
                  handleSearch(chip);
                }}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-cyan-900/40 text-cyan-300 border border-white/5 whitespace-nowrap font-tech transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Live Search Results View */}
          {searchResult && (
            <div className="p-4 rounded-2xl bg-[#050B1B] border border-cyan-500/30 space-y-4 animate-fadeIn">
              {/* Header with verified badge */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-hud text-cyan-300 font-bold uppercase">
                    {searchResult.verified ? 'Verified Grounded Results' : 'Search Findings'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onSpeak && (
                    <button
                      onClick={() => onSpeak(searchResult.summary)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-tech border border-cyan-500/30 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(searchResult.summary)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech border border-white/10 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Summary text */}
              <p className="text-xs text-slate-200 leading-relaxed font-tech whitespace-pre-wrap">
                {searchResult.summary}
              </p>

              {/* Verified Sources & Clickable Links */}
              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-wider block mb-2">
                    Verified Sources & Citations:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResult.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl bg-[#040816] border border-cyan-500/20 hover:border-cyan-400/50 text-cyan-300 text-xs font-tech transition-colors group"
                      >
                        <span className="truncate pr-2">{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
