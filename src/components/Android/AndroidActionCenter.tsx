import React, { useState, useEffect } from 'react';
import { Smartphone, Phone, MessageSquare, Clock, Bell, ExternalLink, Battery, BatteryCharging, Wifi, Vibrate, Share2, Shield, Settings, Play, Camera, MapPin } from 'lucide-react';
import { AndroidIntentService, DeviceTelemetry } from '../../services/androidIntents';
import { VoiceService } from '../../services/voiceService';
import { AssistantAction } from '../../types/assistant';

interface AndroidActionCenterProps {
  onRequestActionConfirm: (action: AssistantAction) => void;
}

export const AndroidActionCenter: React.FC<AndroidActionCenterProps> = ({ onRequestActionConfirm }) => {
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [callNumber, setCallNumber] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [alarmLabel, setAlarmLabel] = useState('Morning Standup');
  const [webQuery, setWebQuery] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('AYRA neural subsystems fully active.');

  useEffect(() => {
    AndroidIntentService.getDeviceTelemetry().then(setTelemetry);
  }, []);

  const handleDialClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNumber.trim()) return;

    onRequestActionConfirm({
      type: 'call',
      title: 'Voice Telephony Intent',
      description: `AYRA will dispatch an Android 'tel:' intent to initiate a phone call.`,
      payload: { number: callNumber.trim() },
      requiresConfirmation: true,
    });
  };

  const handleSmsClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsNumber.trim()) return;

    onRequestActionConfirm({
      type: 'open_url',
      title: 'SMS Message Intent',
      description: `AYRA will launch your default SMS messaging app with pre-filled text.`,
      payload: {
        url: `sms:${smsNumber.trim()}?body=${encodeURIComponent(smsMessage.trim() || 'Message from AYRA AI')}`,
      },
      requiresConfirmation: true,
    });
  };

  const handleAlarmClick = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestActionConfirm({
      type: 'alarm',
      title: 'System Alarm / Timer Intent',
      description: `Dispatch intent to Android Clock / Alarm scheduler for ${alarmTime}.`,
      payload: { time: alarmTime, label: alarmLabel },
      requiresConfirmation: true,
    });
  };

  const handleAppLaunch = (appName: string, query: string = '') => {
    onRequestActionConfirm({
      type: 'open_app',
      title: `Launch ${appName}`,
      description: `AYRA will dispatch a native deep link intent to open ${appName} on your Android device.`,
      payload: { appName, query },
      requiresConfirmation: true,
    });
  };

  const handleTestVibration = () => {
    VoiceService.playHologramTone('listening');
    const success = AndroidIntentService.vibrate([100, 50, 150]);
    if (!success) {
      alert('Vibration API not supported by this browser / device platform.');
    }
  };

  const handleTestNotification = async () => {
    const hasPermission = await AndroidIntentService.requestNotificationPermission();
    if (hasPermission) {
      AndroidIntentService.sendNotification('System Alert', notificationMsg);
      VoiceService.playHologramTone('confirm');
    } else {
      alert('Notification permission denied or unsupported in this context.');
    }
    // Refresh telemetry
    AndroidIntentService.getDeviceTelemetry().then(setTelemetry);
  };

  const handleShareSystem = () => {
    AndroidIntentService.shareContent(
      'AYRA AI Personal Assistant',
      'Check out AYRA AI — Futuristic Android Personal AI Assistant inspired by JARVIS!',
      window.location.href
    );
  };

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-hud text-cyan-400 uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Native Intent Subsystem</span>
            </div>
            <h3 className="text-base font-bold font-tech text-white">Android Mobile Integration Hub</h3>
          </div>
        </div>

        <div className="text-[11px] font-hud text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>INTENTS ONLINE</span>
        </div>
      </div>

      {/* Hardware Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="p-2.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 flex items-center gap-2">
          {telemetry?.isCharging ? (
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          ) : (
            <Battery className="w-4 h-4 text-cyan-400" />
          )}
          <div>
            <div className="text-[10px] font-tech text-slate-400 uppercase">Battery Level</div>
            <div className="font-hud text-xs font-bold text-white">
              {Math.round((telemetry?.batteryLevel ?? 0.9) * 100)}% {telemetry?.isCharging ? '⚡' : ''}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#050B1B] border border-cyan-500/20 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] font-tech text-slate-400 uppercase">Network</div>
            <div className="font-hud text-xs font-bold text-white">
              {telemetry?.isOnline ? 'Online 5G/WiFi' : 'Offline'}
            </div>
          </div>
        </div>

        <button
          onClick={handleTestVibration}
          className="p-2.5 rounded-xl bg-[#050B1B] hover:bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2 transition-colors text-left"
        >
          <Vibrate className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-[10px] font-tech text-slate-400 uppercase">Haptic Engine</div>
            <div className="font-hud text-xs font-bold text-purple-300">Test Vibrate</div>
          </div>
        </button>

        <button
          onClick={handleTestNotification}
          className="p-2.5 rounded-xl bg-[#050B1B] hover:bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2 transition-colors text-left"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] font-tech text-slate-400 uppercase">Notifications</div>
            <div className="font-hud text-xs font-bold text-amber-300 capitalize">
              {telemetry?.notificationPermission || 'Check'}
            </div>
          </div>
        </button>
      </div>

      {/* Grid of Android Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Phone Telephony */}
        <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2 text-xs font-tech text-emerald-400 font-bold uppercase tracking-wider">
            <Phone className="w-4 h-4" />
            <span>Voice Call Intent (tel:)</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 font-tech">
            Dispatches phone call intent. Requires your explicit confirmation before launching the Android dialer.
          </p>
          <form onSubmit={handleDialClick} className="flex gap-2">
            <input
              type="tel"
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              placeholder="Enter phone number (e.g. +923001234567)"
              className="flex-1 bg-[#09142E] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-tech font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Dial Call
            </button>
          </form>
        </div>

        {/* 2. SMS Messaging */}
        <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2 text-xs font-tech text-cyan-400 font-bold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>SMS Message Intent (sms:)</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 font-tech">
            Opens native Android messaging client with recipient and draft text pre-filled.
          </p>
          <form onSubmit={handleSmsClick} className="space-y-2">
            <input
              type="tel"
              value={smsNumber}
              onChange={(e) => setSmsNumber(e.target.value)}
              placeholder="Recipient phone number"
              className="w-full bg-[#09142E] border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="SMS text body..."
                className="flex-1 bg-[#09142E] border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none font-tech"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-xs transition-all"
              >
                Send SMS
              </button>
            </div>
          </form>
        </div>

        {/* 3. Alarm & Clock Scheduler */}
        <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2 text-xs font-tech text-amber-400 font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Set Alarm / Timer Intent</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 font-tech">
            Dispatches Android Alarm Clock intent to program wake-up alarms or focus countdowns.
          </p>
          <form onSubmit={handleAlarmClick} className="flex gap-2 items-center">
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="bg-[#09142E] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
            />
            <input
              type="text"
              value={alarmLabel}
              onChange={(e) => setAlarmLabel(e.target.value)}
              placeholder="Alarm Label"
              className="flex-1 bg-[#09142E] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-tech outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-bold text-xs transition-all"
            >
              Set Alarm
            </button>
          </form>
        </div>

        {/* 4. App Launcher Shortcuts */}
        <div className="p-4 rounded-xl bg-[#050B1B] border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2 text-xs font-tech text-purple-400 font-bold uppercase tracking-wider">
            <Play className="w-4 h-4" />
            <span>Android App Deep Links</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2.5 font-tech">
            Directly switch into installed Android applications:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAppLaunch('WhatsApp')}
              className="p-2 rounded-lg bg-[#09142E] hover:bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-tech font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => handleAppLaunch('YouTube')}
              className="p-2 rounded-lg bg-[#09142E] hover:bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-tech font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <span>YouTube</span>
            </button>
            <button
              onClick={() => handleAppLaunch('Maps')}
              className="p-2 rounded-lg bg-[#09142E] hover:bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs font-tech font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Maps</span>
            </button>
            <button
              onClick={() => handleAppLaunch('Camera')}
              className="p-2 rounded-lg bg-[#09142E] hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-tech font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => handleAppLaunch('Settings')}
              className="p-2 rounded-lg bg-[#09142E] hover:bg-slate-800 border border-white/20 text-slate-300 text-xs font-tech font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              onClick={handleShareSystem}
              className="p-2 rounded-lg bg-[#09142E] hover:bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-tech font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
