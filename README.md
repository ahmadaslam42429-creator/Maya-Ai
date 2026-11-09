# AYRA AI — آئرا AI
### Advanced Android Personal AI Assistant & Quantum Intelligence Cockpit

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green.svg)](https://nodejs.org/)
[![Android SDK](https://img.shields.io/badge/Android-SDK_34-orange.svg)](https://developer.android.com)
[![Gemini AI](https://img.shields.io/badge/Powered%20By-Google%20Gemini-4285F4.svg)](https://ai.google.dev/)

**AYRA AI** (آئرا AI) is a next-generation Android AI personal assistant inspired by JARVIS. It features a photorealistic 3D rigged female avatar with dynamic phoneme lip-sync, real-time continuous duplex live voice conversations, an in-app neural web browser, optical camera OCR vision, multi-session conversation vaults, and seamless native Android device intent automation (phone calls, alarms, SMS, system settings, and app launching).

---

## 🌟 Key Subsystems & Features

### 1. 🧠 JARVIS-Inspired AI Brain
- **Google Gemini Engine**: Server-side multi-turn intelligence powered by `@google/genai` (`gemini-3.8-flash` and `gemini-3.8-flash-lite-tts`).
- **Trilingual Comprehension Matrix**: Seamless, natural understanding and fluent articulation in **English**, **Urdu** (اردو script & Roman Urdu), and **Hindi** (हिन्दी).
- **Persistent Conversation Vault**: Multi-session management enabling users to create new chats, switch threads, rename conversations, and clear history.
- **Autonomous Intent Detection**: Accurately recognizes device automation commands (calls, alarms, reminders, app navigation, web queries) with safety confirmation protocols.

### 2. ⚡ Real-Time Live Voice Mode (Duplex Conversational Audio)
- **Continuous 2-Way Speech**: Hands-free conversation without needing to press the mic button repeatedly.
- **Natural Female Voice**: Powered by high-fidelity speech synthesis with Web Speech API offline fallbacks.
- **Barge-In Speech Interruption**: Speak at any moment to immediately stop AYRA's articulation and pivot context.
- **Real-Time Transcripts**: Dynamic live transcription displaying user speech and AYRA's thoughts.
- **Wake Word System**: Hands-free voice trigger ("Hey AYRA", "AYRA", "آئرا").

### 3. 👤 Photorealistic 3D Rigged Female Avatar
- **Character Model**: Full-body futuristic female character with technology hoodie, headset, and smartwatch.
- **Skeletal Pose Rigging**: Dynamic postures including `SIT`, `STAND`, `WAVE`, `TALK`, `THINK`, and `IDLE`.
- **Phonetic Viseme Lip-Sync**: Realistic mouth shape morphing (`A`, `E`, `O`, `U`, `M`, `F`) synchronized with audio.
- **Natural Biological Behaviors**: Poisson-distribution eyelid blinking, pupil saccades, and pointer gaze tracking.
- **Audio-Reactive Glow**: Real-time canvas waveform and glowing hologram lighting.

### 4. 🌐 In-App Neural Web Browser
- **Integrated Multi-Tab Browsing**: Address bar, search engine switcher (Google, Wikipedia, DuckDuckGo), back/forward/refresh/home controls.
- **AI Webpage Reader & Summarizer**: Extracts accessible webpage text and generates executive summaries with key intelligence takeaways.
- **Interactive Page Q&A**: Ask AYRA specific questions about the open webpage with source citations.
- **Bookmarks & History**: Save favorite portals and inspect navigation history.

### 5. 📱 Android Native Device Control & Intents
- **App Launcher**: Instant deep link integration for WhatsApp, YouTube, Google Maps, Camera, Chrome, Settings, Instagram, Facebook, and TikTok.
- **Telephony & Messaging**: Safe dialer intent (`tel:`) and SMS (`sms:`) preparation with explicit user confirmation.
- **System Alarms & Timers**: Register wake-up alarms and countdowns in the Android Clock subsystem.
- **System Settings Access**: Quick shortcuts for Wi-Fi, Bluetooth, Display, Sound, and Battery settings.
- **Hardware Telemetry**: Real-time battery status, charging indicator, vibration haptics, and system notifications.

### 6. 👁️ Optical Camera Vision & Grounded Search
- **Live Camera Frame Capture**: Instant photo capture and file upload for visual scene analysis.
- **OCR Text Recognition**: Extract and synthesize printed or handwritten text from images.
- **Grounded Web Search**: Real-time live Google Search grounding with verified, clickable source URLs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Canvas Confetti |
| **3D Avatar & Graphics** | Three.js (r187), RoomEnvironment, WebGL, 60 FPS Canvas Audio Visualizer |
| **Backend & APIs** | Node.js 22 LTS, Express.js (`server.ts`), `@google/genai` TypeScript SDK |
| **Audio & Speech** | Gemini 3.8 Flash Lite TTS, Web Speech Recognition API, Web Audio API Oscillator HUD |
| **Android Integration** | Android SDK 34, Kotlin (`MainActivity.kt`), `WebViewAssetLoader`, JavaScriptInterface (`AyraNativeBridge`) |
| **CI/CD Pipeline** | GitHub Actions (`.github/workflows/android-release.yml`), Gradle 8.5, JDK 17 |

---

## 🚀 Development & Local Setup

### Prerequisites
- **Node.js**: Version 22 LTS or higher
- **npm**: Version 10 or higher
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/AYRA-AI.git
cd AYRA-AI
npm ci
```

### 2. Configure Environment Secrets
Create a `.env` file in the root directory:
```properties
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building the Android APK (`AYRA-AI.apk`)

### Option A: Automated GitHub Actions (Recommended)
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: release AYRA AI Android assistant"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/AYRA-AI.git
   git push -u origin main
   ```
2. Trigger the Release:
   - **Tag Push**: `git tag v1.0.0 && git push origin v1.0.0`
   - **Manual Run**: In GitHub, navigate to **Actions** > **AYRA AI Android Build & Release** > **Run workflow**.
3. Download `AYRA-AI.apk` directly from the **Releases** tab or **Workflow Artifacts**.

### Option B: Local Android Build via Gradle
```bash
# Compile web assets into Android directory
npm run build

# Build Android Debug APK
./gradlew assembleDebug

# Output APK location:
# app/build/outputs/apk/debug/AYRA-AI-debug.apk
```

---

## 📲 Installing on Your Android Phone
1. Download `AYRA-AI.apk` to your phone.
2. In your notification panel or File Manager, tap the downloaded APK.
3. If prompted with *"Install unknown apps"*, allow permission for your browser or file manager.
4. Tap **Install** and launch **AYRA AI**!

---

## 🛡️ Android Permissions Reference

| Permission | Purpose |
|---|---|
| `android.permission.INTERNET` | Communication with Gemini AI, grounded search, and weather APIs |
| `android.permission.RECORD_AUDIO` | Speech-to-Text and continuous duplex Live Voice Mode |
| `android.permission.CAMERA` | Optical vision, camera frame capture, and OCR document scanning |
| `android.permission.CALL_PHONE` | Direct dialing intent with user confirmation protocol |
| `android.permission.SET_ALARM` | Scheduling system wake-up alarms and timers |
| `android.permission.POST_NOTIFICATIONS` | Reminders and background assistant status updates |
| `android.permission.VIBRATE` | Tactile sci-fi haptic feedback for user interactions |

---

## 🔧 Troubleshooting & Known Nuances
- **Microphone Access**: Ensure microphone permission is granted in Android app settings or browser prompt.
- **X-Frame-Options on Web**: Certain websites (e.g. google.com, github.com) forbid embedding in iframes; use the built-in **"AI Summarize"** feature or **"Open in Chrome"** button to view them directly.
- **Offline Mode**: If the Gemini API is temporarily unavailable, AYRA's built-in on-device local brain engine automatically handles greetings, intent recognition, mathematical computation, and Urdu/Hindi dialogue.

---

## 📄 License
This project is licensed under the Apache 2.0 License.
