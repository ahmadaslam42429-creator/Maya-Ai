import React, { useState, useEffect } from 'react';
import { VoiceSettings } from '../../types/assistant';
import { Settings, Sliders, Volume2, Mic, Smartphone, Download, Copy, Check, FileCode, Shield, Layers, HelpCircle, Terminal, GitBranch } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';

interface SettingsApkStudioProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: VoiceSettings) => void;
  onThemeChange?: (theme: string) => void;
  activeTheme?: string;
}

export const SettingsApkStudio: React.FC<SettingsApkStudioProps> = ({
  settings,
  onUpdateSettings,
  onThemeChange,
  activeTheme = 'navy',
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'github_actions' | 'apk_guide' | 'manifest' | 'kotlin' | 'architecture'>('github_actions');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    let testPhrase = "Hello! I am MAYA, your personal AI assistant. All neural systems are fully operational.";
    if (settings.language === 'ur') {
      testPhrase = "ہیلو! میں مایا ہوں، آپ کی ذاتی اے آئی اسسٹنٹ۔ میرے تمام سسٹمز فعال ہیں۔";
    } else if (settings.language === 'hi') {
      testPhrase = "नमस्ते! मैं माया हूँ, आपकी पर्सनल एआई असिस्टेंट। सभी सिस्टम्स सक्रिय हैं।";
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

    <!-- Essential Permissions for MAYA AI Assistant -->
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
            <h3 className="text-base font-bold font-tech text-white">MAYA Settings & APK Studio</h3>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#050A17] p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
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
              MAYA AI is pre-configured with a complete GitHub Actions workflow (<code className="text-cyan-300">.github/workflows/android-build.yml</code>). Every push to the <code className="text-cyan-300">main</code> branch or version tag (<code className="text-cyan-300">v*</code>) automatically compiles the debug APK and attaches it to GitHub releases.
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
                  onClick={() => copyToClipboard('git init\ngit add .\ngit commit -m "feat: MAYA AI assistant with Android APK automation"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/MAYA-AI.git\ngit push -u origin main', 'git_push')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'git_push' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-2 rounded bg-black/60 text-cyan-200 font-mono text-[10px] overflow-x-auto">
{`git init
git add .
git commit -m "feat: MAYA AI assistant"
git branch -M main
git remote add origin https://github.com/USER/MAYA-AI.git
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
                <li>Every commit to <code className="text-cyan-300">main</code> automatically compiles the APK and attaches it to the workflow artifacts.</li>
                <li>Builds <code className="text-cyan-300">MAYA-AI.apk</code> and <code className="text-cyan-300">MAYA-AI-debug.apk</code> via Gradle 8.5 &amp; JDK 17.</li>
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
                <p><strong>Option B (No Git CLI needed):</strong> In GitHub, go to <em>Actions</em> &gt; <em>MAYA AI Android Build &amp; Release</em> &gt; <em>Run workflow</em> &gt; click <strong>Run workflow</strong>.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  4. Download MAYA-AI.apk
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Releases &amp; Artifacts</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Under <strong>Releases</strong> on your GitHub repo, click <strong>MAYA AI v1.0.0</strong> to download <code className="text-cyan-300">MAYA-AI.apk</code>.</li>
                <li>Or go to <strong>Actions</strong> &gt; click the latest run &gt; scroll to <strong>Artifacts</strong> &gt; click <code className="text-cyan-300">MAYA-AI-debug-apk</code>.</li>
                <li><em>Tip:</em> Ensure GitHub repo <strong>Settings &gt; Actions &gt; General &gt; Workflow permissions</strong> is set to <strong>"Read and write permissions"</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Workflow File Codebox */}
          <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/30">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-xs font-hud text-cyan-300 uppercase">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>.github/workflows/android-build.yml</span>
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
      create_release:
        description: 'Publish GitHub Release for this build'
        required: false
        type: boolean
        default: false
      release_tag:
        description: 'Release tag name (e.g., v1.0.0)'
        required: false
        default: 'v1.0.0'

permissions:
  contents: write

jobs:
  build:
    name: Build Android Debug APK
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
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
      - name: Verify APK
        run: |
          mkdir -p build-artifacts
          cp app/build/outputs/apk/debug/MAYA-AI-debug.apk build-artifacts/
      - uses: actions/upload-artifact@v4
        with:
          name: MAYA-AI-debug-apk
          path: build-artifacts/MAYA-AI-debug.apk
      - if: startsWith(github.ref, 'refs/tags/v') || github.event.inputs.create_release == true
        uses: softprops/action-gh-release@v2
        with:
          files: build-artifacts/MAYA-AI-debug.apk
          name: "MAYA AI"
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
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'
      - run: npm ci && npm run build
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17', cache: 'gradle' }
      - run: chmod +x gradlew && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: MAYA-AI-debug-apk
          path: app/build/outputs/apk/debug/MAYA-AI-debug.apk
      - uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/v')
        with:
          files: app/build/outputs/apk/debug/MAYA-AI-debug.apk`}
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
                  MAYA automatically articulates spoken responses whenever a response finishes generating.
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
              Building a Native Android Release APK for MAYA AI
            </h4>
            <p className="text-slate-300 leading-relaxed">
              MAYA AI is built mobile-first. Follow these standard instructions to export and package the application into a standalone Android APK using Capacitor and Android Studio.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  Step 1: Install Capacitor Native Runtime
                </span>
                <button
                  onClick={() => copyToClipboard('npm install @capacitor/core @capacitor/cli @capacitor/android', 'step1')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Command</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-[11px] overflow-x-auto">
                npm install @capacitor/core @capacitor/cli @capacitor/android
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  Step 2: Initialize & Build Web Assets
                </span>
                <button
                  onClick={() => copyToClipboard('npx cap init "MAYA AI" "ai.maya.assistant" --web-dir dist\nnpm run build\nnpx cap add android', 'step2')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Commands</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-[11px] overflow-x-auto">
                {`npx cap init "MAYA AI" "ai.maya.assistant" --web-dir dist
npm run build
npx cap add android`}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-hud font-bold text-cyan-300 text-xs">
                  Step 3: Open in Android Studio & Compile Release APK
                </span>
                <button
                  onClick={() => copyToClipboard('npx cap open android', 'step3')}
                  className="text-cyan-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-[11px] overflow-x-auto mb-2">
                npx cap open android
              </pre>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>In Android Studio, let Gradle sync complete.</li>
                <li>Verify permissions in <code className="text-cyan-300">android/app/src/main/AndroidManifest.xml</code>.</li>
                <li>Go to <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                <li>The release or debug APK will be generated in <code className="text-cyan-300">android/app/build/outputs/apk/debug/app-debug.apk</code>.</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B1B] border border-cyan-500/20">
              <span className="font-hud font-bold text-cyan-300 text-xs block mb-1">
                Step 4: Install on Android Phone
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Transfer the <code className="text-cyan-300">.apk</code> file to your Android phone via USB, Google Drive, or WhatsApp.</li>
                <li>Enable <em>"Install unknown apps"</em> in Android Settings for your file manager.</li>
                <li>Tap the APK to install. MAYA AI will appear on your home screen with high-tech hologram launcher icon!</li>
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
              android/app/src/main/AndroidManifest.xml
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
              android/app/src/main/java/ai/maya/assistant/MainActivity.kt
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
            <h4 className="font-hud font-bold text-white text-sm mb-2">MAYA AI Full-Stack Architecture</h4>
            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>
                <strong>Frontend:</strong> React 19 + TypeScript + Vite + Tailwind CSS with hardware-accelerated animations, custom holographic SVG vector avatar with 7 emotional expressions, Web Speech API (Speech Recognition + Speech Synthesis), Web Audio chimes, and Canvas 60fps audio waveform.
              </p>
              <p>
                <strong>Backend Service:</strong> Express.js server (`server.ts`) powering secure Google Gemini AI (`@google/genai` model `gemini-3.8-flash`) endpoints for conversational chat with emotion classification, multilingual translation (English, Urdu, Hindi), document summarization, and Android intent detection.
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
{`MAYA-AI/
├── server.ts                       # Full-stack Express + Gemini API backend
├── src/
│   ├── App.tsx                     # Main cockpit & state coordinator
│   ├── types/assistant.ts          # Emotions, Actions, Memory, Telemetry
│   ├── services/
│   │   ├── voiceService.ts         # STT, TTS, Web Audio Synthesizer, Wake Word
│   │   └── androidIntents.ts       # Native intents (tel, sms, apps, haptics)
│   ├── components/
│   │   ├── Avatar/MayaAvatar.tsx   # Holographic female avatar (7 emotions)
│   │   ├── Voice/VoiceWaveform.tsx # Canvas 60fps audio waveform visualizer
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
