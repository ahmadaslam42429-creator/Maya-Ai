import React, { useState, useEffect } from 'react';
import { VoiceSettings, AvatarPose } from '../../types/assistant';
import { Settings, Sliders, Volume2, Mic, Smartphone, Download, Copy, Check, FileCode, Shield, Layers, HelpCircle, Terminal, GitBranch, User, Sparkles, Eye } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';
import { RealisticMayaAvatar } from '../Avatar/RealisticMayaAvatar';

interface SettingsApkStudioProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: VoiceSettings) => void;
  onThemeChange?: (theme: string) => void;
  activeTheme?: string;
  avatarPose?: AvatarPose;
  onPoseChange?: (pose: AvatarPose) => void;
}

export const SettingsApkStudio: React.FC<SettingsApkStudioProps> = ({
  settings,
  onUpdateSettings,
  onThemeChange,
  activeTheme = 'navy',
  avatarPose = 'sit',
  onPoseChange,
}) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'voice' | 'github_actions' | 'apk_guide' | 'manifest' | 'kotlin' | 'architecture'>('avatar');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPose, setSelectedPose] = useState<AvatarPose>(avatarPose);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);
  const [avatarQuality, setAvatarQuality] = useState<'ultra' | 'high' | 'balanced'>('ultra');

  useEffect(() => {
    const loadVoices = () => {
      const v = VoiceService.getVoices();
      setAvailableVoices(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTestVoice = () => {
    let testPhrase = "Hello! I am AYRA, your personal AI assistant. All neural systems are fully operational.";
    if (settings.language === 'ur') {
      testPhrase = "ہیلو! میں آئرا ہوں، آپ کی ذاتی اے آئی اسسٹنٹ۔ میرے تمام سسٹمز فعال ہیں۔";
    } else if (settings.language === 'hi') {
      testPhrase = "नमस्ते! मैं आयरा हूँ, आपकी पर्सनल एआई असिस्टेंट। सभी सिस्टम्स सक्रिय हैं।";
    }

    VoiceService.speak(testPhrase, {
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      voiceURI: settings.voiceURI,
      language: settings.language,
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    AndroidIntentService.copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const ANDROID_MANIFEST_XML = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ai.maya.assistant">

    <!-- Essential Permissions for AYRA AI Assistant -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SET_ALARM" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MayaAI"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:theme="@style/Theme.MayaAI.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <!-- Voice Assistant Intent Trigger -->
                <action android:name="android.intent.action.VOICE_COMMAND" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.VOICE" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const MAIN_ACTIVITY_KOTLIN = `package ai.maya.assistant

import android.os.Bundle
import android.content.Intent
import android.net.Uri
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import com.getcapacitor.BridgeActivity
import java.util.Locale

class MainActivity : BridgeActivity(), TextToSpeech.OnInitListener {
    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var isListening = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Speech Synthesizer for MAYA Female Voice
        tts = TextToSpeech(this, this)

        // Request Audio and Phone Permissions
        val requestPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val micGranted = permissions[android.Manifest.permission.RECORD_AUDIO] ?: false
            if (micGranted) {
                initializeVoiceRecognition()
            }
        }

        requestPermissionLauncher.launch(
            arrayOf(
                android.Manifest.permission.RECORD_AUDIO,
                android.Manifest.permission.CALL_PHONE,
                android.Manifest.permission.POST_NOTIFICATIONS
            )
        )
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.ENGLISH
            // Pitch tuning for friendly female assistant
            tts?.setPitch(1.15f)
            tts?.setSpeechRate(1.05f)
        }
    }

    private fun initializeVoiceRecognition() {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onError(error: Int) {}
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val voiceCommand = matches?.firstOrNull() ?: ""
                handleVoiceCommand(voiceCommand)
            }
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
    }

    private fun handleVoiceCommand(command: String) {
        // Dispatch event back into WebView bridge
        bridge?.triggerJSEvent("onMayaVoiceCommand", "{ 'command': '\$command' }")
    }

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        tts?.stop()
        tts?.shutdown()
    }
}`;

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest">Configuration & Android Deployment</span>
            <h3 className="text-base font-bold font-tech text-white">AYRA Settings & APK Studio</h3>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#050A17] p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'avatar' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>3D Avatar Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('github_actions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'github_actions' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>GitHub Actions CI/CD</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'voice' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Voice & Persona</span>
          </button>
          <button
            onClick={() => setActiveTab('apk_guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'apk_guide' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Build Release APK</span>
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'manifest' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Permissions Manifest</span>
          </button>
          <button
            onClick={() => setActiveTab('kotlin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'kotlin' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Kotlin MainActivity</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech transition-all shrink-0 ${
              activeTab === 'architecture' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Structure & Arch</span>
          </button>
        </div>
      </div>

      {/* Tab: 3D Avatar Customization Studio */}
      {activeTab === 'avatar' && (
        <div className="space-y-4 animate-fadeIn text-xs font-tech">
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#071330] to-[#0E1F4B] border border-cyan-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold font-hud text-white">AYRA 3D Avatar Configuration</h4>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Fine-tune skeletal poses, camera framing, real-time phoneme lip-sync, and 3D rendering parameters.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-hud text-[10px] font-bold shrink-0">
              WebGL 60 FPS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Live Avatar Preview */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#040816] border border-cyan-500/30">
              <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest mb-2 block">
                Live Interactive Viewport
              </span>
              <RealisticMayaAvatar
                activePose={selectedPose}
                onPoseChange={(p) => {
                  setSelectedPose(p);
                  onPoseChange?.(p);
                }}
                size="md"
                framing="upper"
                showControls={false}
              />
              <div className="flex items-center gap-1.5 mt-3">
                {(['sit', 'stand', 'wave', 'think', 'talk'] as AvatarPose[]).map((pose) => (
                  <button
                    key={pose}
                    onClick={() => {
                      setSelectedPose(pose);
                      onPoseChange?.(pose);
                    }}
                    className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-hud font-bold transition-all ${
                      selectedPose === pose
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-[#081534] border border-cyan-500/20 text-slate-300 hover:text-white'
                    }`}
                  >
                    {pose}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Customization Controls */}
            <div className="space-y-3">
              {/* Default Pose Setting */}
              <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
                <span className="font-hud font-bold text-cyan-300 text-xs block">Default Session Posture</span>
                <p className="text-slate-400 text-[11px]">
                  Choose whether AYRA starts seated at her workstation or standing on stage.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedPose('sit');
                      onPoseChange?.('sit');
                    }}
                    className={`py-2 px-3 rounded-xl font-hud text-xs font-bold border transition-all ${
                      selectedPose === 'sit'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-[#071330] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    🪑 Seated Workstation (Default)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPose('stand');
                      onPoseChange?.('stand');
                    }}
                    className={`py-2 px-3 rounded-xl font-hud text-xs font-bold border transition-all ${
                      selectedPose === 'stand'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-[#071330] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    🧍 Standing Stage Mode
                  </button>
                </div>
              </div>

              {/* Lip-Sync & Audio Rigging */}
              <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-hud font-bold text-cyan-300 text-xs block">Phoneme Lip-Syncing</span>
                    <span className="text-[11px] text-slate-400">
                      Sync mouth visemes in real-time with spoken TTS sentences.
                    </span>
                  </div>
                  <button
                    onClick={() => setLipSyncEnabled(!lipSyncEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      lipSyncEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        lipSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Rendering Performance Mode */}
              <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
                <span className="font-hud font-bold text-cyan-300 text-xs block">Render Quality & Frame Pacing</span>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'ultra', label: 'Ultra (60 FPS)' },
                    { id: 'high', label: 'High (Balanced)' },
                    { id: 'balanced', label: 'Battery Saver' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setAvatarQuality(q.id as any)}
                      className={`py-1.5 px-2 rounded-lg font-tech text-xs border transition-colors ${
                        avatarQuality === q.id
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : 'bg-[#071330] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: GitHub Actions Automated Build & Release */}
      {activeTab === 'github_actions' && (
        <div className="space-y-4 animate-fadeIn text-xs font-tech">
          {/* Header Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#071330] to-[#0E1F4B] border border-cyan-500/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold font-hud text-white">
                  Automated Android Debug APK & GitHub Releases
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-hud font-bold">
                CI/CD READY
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              AYRA AI is pre-configured with a complete GitHub Actions workflow (<code className="text-cyan-300">.github/workflows/android-release.yml</code>). Manual dispatch and version tags (<code className="text-cyan-300">v*</code>) compile the release APK and attach <code className="text-cyan-300">AYRA-AI.apk</code> directly to GitHub Releases.
            </p>
          </div>

          {/* 4-Step Instructions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  1. Push Project to GitHub
                </span>
                <button
                  onClick={() => copyToClipboard('git init\ngit add .\ngit commit -m "feat: AYRA AI assistant with Android APK release"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/AYRA-AI.git\ngit push -u origin main', 'git_push')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'git_push' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-black/60 text-cyan-200 font-mono text-[10px] overflow-x-auto">
{`git init
git add .
git commit -m "feat: AYRA AI assistant"
git branch -M main
git remote add origin https://github.com/USER/AYRA-AI.git
git push -u origin main`}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  2. Automatic Build on Push
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Push to main</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Every commit to <code className="text-cyan-300">main</code> automatically compiles the APK and uploads it to workflow artifacts.</li>
                <li>Builds <code className="text-cyan-300">AYRA-AI.apk</code> and <code className="text-cyan-300">AYRA-AI-debug.apk</code> via Gradle &amp; JDK 17.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  3. Trigger GitHub Release (2 Ways)
                </span>
                <button
                  onClick={() => copyToClipboard('git tag v1.0.0\ngit push origin v1.0.0', 'git_tag')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'git_tag' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Tag Cmd</span>
                </button>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 leading-relaxed">
                <p><strong>Option A (Recommended):</strong> Push a version tag:</p>
                <code className="block p-1.5 rounded bg-black/60 text-cyan-200 font-mono text-[10px]">
                  git tag v1.0.0 && git push origin v1.0.0
                </code>
                <p><strong>Option B (No Git CLI needed):</strong> In GitHub, go to <em>Actions</em> &gt; <em>AYRA AI Android Build &amp; Release</em> &gt; <em>Run workflow</em> &gt; click <strong>Run workflow</strong>.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  4. Download AYRA-AI.apk
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Releases &amp; Artifacts</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Under <strong>Releases</strong> on your GitHub repo, click <strong>AYRA AI Release</strong> to download <code className="text-cyan-300">AYRA-AI.apk</code>.</li>
                <li>Or go to <strong>Actions</strong> &gt; click the latest run &gt; scroll to <strong>Artifacts</strong> &gt; click <code className="text-cyan-300">AYRA-AI-apk</code>.</li>
                <li><em>Tip:</em> Ensure GitHub repo <strong>Settings &gt; Actions &gt; General &gt; Workflow permissions</strong> is set to <strong>"Read and write permissions"</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Workflow File Codebox */}
          <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/30">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-xs font-hud text-cyan-300 uppercase">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>.github/workflows/android-release.yml</span>
              </div>
              <button
                onClick={() => copyToClipboard(`name: MAYA AI Android Build & Release

on:
  push:
    branches:
      - main
      - master
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      custom_tag:
        description: 'Custom version tag (optional, e.g. v1.0.5)'
        required: false
        default: ''

permissions:
  contents: write

jobs:
  release:
    name: Build & Publish Android Release APK
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      - run: npm ci

      - run: |
          npm run build
          mkdir -p app/src/main/assets/public
          cp -r dist/* app/src/main/assets/public/
          cp -r dist/* app/src/main/assets/

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - run: chmod +x gradlew

      - run: ./gradlew assembleDebug --stacktrace --no-daemon

      - name: Verify & Package APK
        run: |
          mkdir -p build-artifacts
          OUTPUT_DIR="app/build/outputs/apk/debug"
          if [ -f "$OUTPUT_DIR/MAYA-AI-debug.apk" ]; then
            TARGET_APK="$OUTPUT_DIR/MAYA-AI-debug.apk"
          else
            TARGET_APK=$(find app/build/outputs/apk -name "*.apk" | head -n 1)
          fi
          cp "$TARGET_APK" build-artifacts/MAYA-AI.apk
          cp "$TARGET_APK" build-artifacts/MAYA-AI-debug.apk

      - uses: actions/upload-artifact@v4
        with:
          name: MAYA-AI-apk
          path: |
            build-artifacts/MAYA-AI.apk
            build-artifacts/MAYA-AI-debug.apk

      - name: Compute Release Tag
        id: release_meta
        run: |
          if [[ "\${{ github.ref }}" == refs/tags/v* ]]; then
            TAG="\${GITHUB_REF#refs/tags/}"
          elif [ -n "\${{ github.event.inputs.custom_tag }}" ]; then
            TAG="\${{ github.event.inputs.custom_tag }}"
          else
            TAG="v1.0.\${{ github.run_number }}"
          fi
          echo "tag=$TAG" >> $GITHUB_OUTPUT

      - uses: softprops/action-gh-release@v2
        with:
          files: |
            build-artifacts/MAYA-AI.apk
            build-artifacts/MAYA-AI-debug.apk
          name: "MAYA AI Android Release \${{ steps.release_meta.outputs.tag }}"
          tag_name: \${{ steps.release_meta.outputs.tag }}
          target_commitish: \${{ github.sha }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`, 'workflow_yml')}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 text-xs border border-cyan-500/30 font-tech"
              >
                {copiedKey === 'workflow_yml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Workflow YAML</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-black/70 text-cyan-300 font-mono text-[10px] overflow-x-auto max-h-64">
{`name: MAYA AI Android Build & Release
on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm', cache-dependency-path: 'package-lock.json' }
      - run: npm ci && npm run build
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17', cache: 'gradle' }
      - run: chmod +x gradlew && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with: { name: MAYA-AI-apk, path: build-artifacts/ }
      - uses: softprops/action-gh-release@v2
        with:
          files: build-artifacts/MAYA-AI.apk
          name: "MAYA AI Android Release v1.0.\${{ github.run_number }}"
          tag_name: "v1.0.\${{ github.run_number }}"`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 1: Voice & Persona Settings */}
      {activeTab === 'voice' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Language Selector */}
          <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20">
            <label className="block text-xs font-hud text-cyan-300 uppercase mb-2">
              Primary Interaction Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en', label: 'English', sub: 'Default US/UK' },
                { code: 'ur', label: 'اردو (Urdu)', sub: 'Pakistani / Nastaliq' },
                { code: 'hi', label: 'हिन्दी (Hindi)', sub: 'Devanagari' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => onUpdateSettings({ ...settings, language: l.code as any })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.language === l.code
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-[#09142E] border-white/10 hover:border-white/30 text-slate-400'
                  }`}
                >
                  <div className="font-tech font-bold text-sm text-white">{l.label}</div>
                  <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">{l.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Select & Modulators */}
          <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-4">
            <div>
              <label className="block text-xs font-hud text-cyan-300 uppercase mb-1.5">
                Female Voice Synthesizer Profile
              </label>
              <select
                value={settings.voiceURI}
                onChange={(e) => onUpdateSettings({ ...settings, voiceURI: e.target.value })}
                className="w-full bg-[#09142E] border border-cyan-500/30 rounded-lg p-2.5 text-xs text-white outline-none font-tech"
              >
                <option value="">Auto Select Best Female Voice (JARVIS Persona)</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-tech text-slate-400 mb-1">
                  <span>Speech Rate</span>
                  <span className="font-hud text-cyan-400">{settings.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={settings.rate}
                  onChange={(e) => onUpdateSettings({ ...settings, rate: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-tech text-slate-400 mb-1">
                  <span>Voice Pitch</span>
                  <span className="font-hud text-cyan-400">{settings.pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.05"
                  value={settings.pitch}
                  onChange={(e) => onUpdateSettings({ ...settings, pitch: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-tech text-slate-400 mb-1">
                  <span>Volume Level</span>
                  <span className="font-hud text-cyan-400">{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Test Voice Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleTestVoice}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 font-tech font-bold text-xs transition-all shadow-md"
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Test Synthesized Audio</span>
              </button>
            </div>
          </div>

          {/* Wake Word & Automation Toggles */}
          <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-hud text-white uppercase">Wake-Word Listening Mode ("Hey Maya")</div>
                <p className="text-[11px] text-slate-400 font-tech">
                  Listens for "Hey Maya" or "Maya" to immediately trigger vocal listening mode.
                </p>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, wakeWordEnabled: !settings.wakeWordEnabled })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.wakeWordEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <div className="text-xs font-hud text-white uppercase">Auto-Recite AI Responses</div>
                <p className="text-[11px] text-slate-400 font-tech">
                  AYRA automatically articulates spoken responses whenever a response finishes generating.
                </p>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.autoSpeak ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Build Release APK Guide */}
      {activeTab === 'apk_guide' && (
        <div className="space-y-4 animate-fadeIn text-xs font-tech">
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#071330] to-[#0E1F4B] border border-cyan-500/30">
            <h4 className="text-sm font-bold font-hud text-white mb-1">
              Building a Native Android Release APK for AYRA AI
            </h4>
            <p className="text-slate-300 leading-relaxed">
              AYRA AI is built mobile-first. The project contains a native Android wrapper (`/app`) and automated GitHub Actions workflow to export and package the application into a standalone Android APK.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  Step 1: Build Web Assets for Android
                </span>
                <button
                  onClick={() => copyToClipboard('npm run build', 'step1')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Command</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-[11px] overflow-x-auto">
                npm run build
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  Step 2: Automated GitHub Release or Local Gradle
                </span>
                <button
                  onClick={() => copyToClipboard('./gradlew assembleDebug', 'step2')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Commands</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-[11px] overflow-x-auto">
                ./gradlew assembleDebug
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  Step 3: Open in Android Studio & Compile Release APK
                </span>
                <button
                  onClick={() => copyToClipboard('./gradlew assembleRelease', 'step3')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-[11px] overflow-x-auto mb-2">
                ./gradlew assembleRelease
              </pre>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>In Android Studio, open the root directory. Let Gradle sync complete.</li>
                <li>Verify permissions in <code className="text-cyan-300">app/src/main/AndroidManifest.xml</code>.</li>
                <li>Go to <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                <li>The release or debug APK will be generated in <code className="text-cyan-300">app/build/outputs/apk/debug/AYRA-AI-debug.apk</code>.</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <span className="font-hud font-bold text-cyan-300 text-xs block mb-1">
                Step 4: Install on Android Phone
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Transfer the <code className="text-cyan-300">AYRA-AI.apk</code> file to your Android phone via USB, Google Drive, or WhatsApp.</li>
                <li>Enable <em>"Install unknown apps"</em> in Android Settings for your file manager.</li>
                <li>Tap the APK to install. AYRA AI will appear on your home screen with high-tech hologram launcher icon!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions Manifest */}
      {activeTab === 'manifest' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-hud text-cyan-300 uppercase">
              app/src/main/AndroidManifest.xml
            </span>
            <button
              onClick={() => copyToClipboard(ANDROID_MANIFEST_XML, 'manifest')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 text-xs border border-cyan-500/30 font-tech"
            >
              {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy XML</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-96">
            {ANDROID_MANIFEST_XML}
          </pre>
        </div>
      )}

      {/* Tab 4: Kotlin MainActivity */}
      {activeTab === 'kotlin' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-hud text-cyan-300 uppercase">
              app/src/main/java/ai/maya/assistant/MainActivity.kt
            </span>
            <button
              onClick={() => copyToClipboard(MAIN_ACTIVITY_KOTLIN, 'kotlin')}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 text-xs border border-cyan-500/30 font-tech"
            >
              {copiedKey === 'kotlin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Kotlin</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-black/70 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-96">
            {MAIN_ACTIVITY_KOTLIN}
          </pre>
        </div>
      )}

      {/* Tab 5: Project Architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-4 animate-fadeIn text-xs font-tech">
          <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20">
            <h4 className="font-hud font-bold text-white text-sm mb-2">AYRA AI Full-Stack Architecture</h4>
            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>
                <strong>Frontend:</strong> React 19 + TypeScript + Vite + Tailwind CSS with hardware-accelerated animations, photorealistic extracted 3D rigged avatar with 7 emotional expressions, Web Speech API (Speech Recognition + Speech Synthesis), Web Audio chimes, and Canvas 60fps audio waveform.
              </p>
              <p>
                <strong>Backend Service:</strong> Express.js server (`server.ts`) powering secure Google Gemini AI (`@google/genai` model `gemini-3.8-flash` and `gemini-3.8-flash-lite-tts`) endpoints for conversational chat with emotion classification, multilingual translation (English, Urdu, Hindi), document summarization, and Android intent detection.
              </p>
              <p>
                <strong>Mobile Subsystems:</strong> Native intent filters (`tel:`, `sms:`, `intent://`, `geo:`, `vnd.youtube:`, `wa.me`), vibration haptics, battery status API, Notification API, and confirmation protocol for all sensitive actions.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
            <span className="font-hud font-bold text-cyan-300 text-xs block mb-1">
              Project File Hierarchy
            </span>
            <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-300 font-mono text-[10px] overflow-x-auto">
{`AYRA-AI/
├── server.ts                       # Full-stack Express + Gemini API backend
├── src/
│   ├── App.tsx                     # Main cockpit & state coordinator
│   ├── types/assistant.ts          # Emotions, Actions, Memory, Telemetry
│   ├── services/
│   │   ├── voiceService.ts         # STT, TTS, Web Audio Synthesizer, Wake Word
│   │   └── androidIntents.ts       # Native intents (tel, sms, apps, haptics)
│   ├── components/
│   │   ├── Avatar/AyraRiggedAvatar # 3D Photorealistic Rigged Avatar
│   │   ├── Voice/                  # Voice HUD, Live Voice Duplex mode
│   │   ├── Browser/                # Built-in multi-tab neural web browser
│   │   ├── Vision/                 # Camera OCR & Grounded web search
│   │   ├── Android/                # Action confirmation modal & intent center
│   │   ├── Tools/                  # Weather, Calculator, Summarizer, Translator
│   │   ├── Memory/                 # Encrypted client memory & notes manager
│   │   └── Settings/               # Voice config & Android APK Studio
├── package.json
└── vite.config.ts`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
