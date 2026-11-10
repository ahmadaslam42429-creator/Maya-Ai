/**
 * AYRA AI — Mark Armor & Arc Reactor Telemetry Cockpit
 * Inspired by Tony Stark's Iron Man armor engineering & JARVIS HUD diagnostics.
 * Includes interactive Arc Reactor core, real-time subsystem integrity,
 * live device flight gyroscopes, repulsor charge simulation, and Mark protocols.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Shield, 
  Activity, 
  Cpu, 
  Crosshair, 
  Radio, 
  Flame, 
  Gauge, 
  Volume2, 
  Compass, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Terminal,
  Power
} from 'lucide-react';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';

export type MarkSuitModel = 'mark_5' | 'mark_45' | 'mark_55' | 'mark_85';

interface ArmorSubsystem {
  id: string;
  name: string;
  location: string;
  integrity: number;
  status: 'optimal' | 'warning' | 'standby';
  spec: string;
}

interface MarkArmorCockpitProps {
  onSpeakProtocol?: (phrase: string) => void;
  onNavigateHome?: () => void;
  activeLanguage?: string;
}

export const MarkArmorCockpit: React.FC<MarkArmorCockpitProps> = ({
  onSpeakProtocol,
  onNavigateHome,
  activeLanguage = 'en'
}) => {
  const [selectedSuit, setSelectedSuit] = useState<MarkSuitModel>('mark_55');
  const [arcPower, setArcPower] = useState(100);
  const [repulsorCharged, setRepulsorCharged] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [isFiringRepulsor, setIsFiringRepulsor] = useState(false);
  const [targetingLocked, setTargetingLocked] = useState(false);
  const [thermalScanActive, setThermalScanActive] = useState(false);
  const [sentryMode, setSentryMode] = useState(false);
  
  // Real device motion & orientation telemetry
  const [gyro, setGyro] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const [telemetry, setTelemetry] = useState({
    battery: 92,
    voltage: '3.85V',
    coreTemp: '36.4°C',
    thrustOutput: '14,200 N',
    naniteReserve: '94.8%'
  });

  // Sound generator using Web Audio API for authentic Stark repulsor & unibeam tones
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playRepulsorCharge = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      
      const now = ctx.currentTime;
      // High-frequency rising whine characteristic of Iron Man repulsor
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 1.2);
      
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 1.3);
    } catch {}
  };

  const playRepulsorBlast = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // 1. Sharp repulsor release burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
      
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // 2. Sub-bass shockwave impact
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.45);
    } catch {}
  };

  // Device orientation tracking
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      setGyro({
        pitch: Math.round(e.beta || 0),
        roll: Math.round(e.gamma || 0),
        yaw: Math.round(e.alpha || 0),
      });
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // Refresh system telemetry
    AndroidIntentService.getDeviceTelemetry().then((tel) => {
      setTelemetry((prev) => ({
        ...prev,
        battery: Math.round(tel.batteryLevel * 100) || 92,
      }));
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Suit profiles configuration
  const SUIT_PROFILES: Record<
    MarkSuitModel,
    {
      name: string;
      code: string;
      tagline: string;
      specialty: string;
      plating: string;
      repulsorYield: string;
      flightSpeed: string;
      accentColor: string;
      borderClass: string;
      glowClass: string;
    }
  > = {
    mark_5: {
      name: 'MARK V (Suitcase)',
      code: 'EMERGENCY COMPACT DEPLOY',
      tagline: 'Lightweight Portable Folding Titanium Exoskeleton',
      specialty: '0.8s Rapid deployment, urban intercept, hand-held portability',
      plating: 'Interlocking lightweight articulated steel-titanium scales',
      repulsorYield: '85 GW/pulse',
      flightSpeed: 'Mach 2.2',
      accentColor: '#EF4444',
      borderClass: 'border-red-500/50',
      glowClass: 'shadow-red-500/30',
    },
    mark_45: {
      name: 'MARK XLV (Sokovia Defense)',
      code: 'INTEGRATED F.R.I.D.A.Y. CORE',
      tagline: 'First armor to integrate Friday AI voice interface',
      specialty: 'High-density unibeam, nanoweave heat shields, orbital reentry',
      plating: 'Gold-Titanium alloy reinforced matrix with chrome hex accents',
      repulsorYield: '140 GW/pulse',
      flightSpeed: 'Mach 4.5',
      accentColor: '#F59E0B',
      borderClass: 'border-amber-500/50',
      glowClass: 'shadow-amber-500/30',
    },
    mark_55: {
      name: 'MARK LV (55 - Apex Guardian)',
      code: 'HEAVY IMPACT SYSTEM OVERRIDE',
      tagline: 'High-endurance heavy defense & cognitive AI matrix',
      specialty: 'Kinetic dampening shields, Fin-Fang class containment, multi-vectored thrust',
      plating: 'Carbon-Nanotube mesh overlaid with Vibranium lattice weave',
      repulsorYield: '210 GW/pulse',
      flightSpeed: 'Mach 5.8',
      accentColor: '#00F0FF',
      borderClass: 'border-cyan-500/50',
      glowClass: 'shadow-cyan-500/30',
    },
    mark_85: {
      name: 'MARK LXXXV (Endgame Prime)',
      code: 'ADVANCED NANOTECH BLEEDING-EDGE',
      tagline: 'Full dynamic weapon morphing & Infinity energy channeling',
      specialty: 'Energy blade synthesis, lightning redirection, universal Gauntlet channel',
      plating: 'Programmable smart liquid nanite matrix with active photon weave',
      repulsorYield: '380 GW/pulse',
      flightSpeed: 'Sub-Orbital Escape Velocity (Mach 8.0+)',
      accentColor: '#9D4EDD',
      borderClass: 'border-purple-500/50',
      glowClass: 'shadow-purple-500/30',
    },
  };

  const currentSuit = SUIT_PROFILES[selectedSuit];

  const subsystems: ArmorSubsystem[] = [
    {
      id: 'sub-helmet',
      name: 'HUD Neural Sensor Array',
      location: 'Cranial Visor',
      integrity: 100,
      status: 'optimal',
      spec: '360° LiDAR, infrared targeting, optical OCR tracking',
    },
    {
      id: 'sub-arc',
      name: 'Palladium/Vibranium Arc Reactor',
      location: 'Chest Core Plate',
      integrity: Math.min(100, arcPower),
      status: arcPower > 80 ? 'optimal' : 'warning',
      spec: '12.4 GJ/s sustained unibeam output with auto-cooling loop',
    },
    {
      id: 'sub-left-rep',
      name: 'Port Repulsor Gauntlet',
      location: 'Left Hand & Wrist',
      integrity: 98,
      status: 'optimal',
      spec: 'Ion plasma discharge with variable dispersion focal ring',
    },
    {
      id: 'sub-right-rep',
      name: 'Starboard Repulsor Gauntlet',
      location: 'Right Hand & Wrist',
      integrity: 100,
      status: 'optimal',
      spec: 'Precision laser guidance, kinetic shockwave aperture',
    },
    {
      id: 'sub-thrusters',
      name: 'Supersonic Boot Thrusters',
      location: 'Lower Extremities',
      integrity: 96,
      status: 'optimal',
      spec: 'Dual-vectored aerodynamic aerospike turbofans',
    },
    {
      id: 'sub-nanites',
      name: 'Liquid Nanite Reservoir',
      location: 'Sub-dermal Torso Pouch',
      integrity: 95,
      status: 'optimal',
      spec: 'Dynamic shield morphing & instant structural repair weave',
    },
  ];

  // Actions
  const handleChargeRepulsor = () => {
    if (isCharging || isFiringRepulsor) return;
    setIsCharging(true);
    playRepulsorCharge();
    AndroidIntentService.vibrate([40, 60, 100, 140]);

    setTimeout(() => {
      setIsCharging(false);
      setRepulsorCharged(true);
      VoiceService.playHologramTone('confirm');
      onSpeakProtocol?.('Repulsor capacitors at maximum charge. Weapons systems unlocked.');
    }, 1300);
  };

  const handleFireRepulsor = () => {
    if (isFiringRepulsor) return;
    setIsFiringRepulsor(true);
    setRepulsorCharged(false);
    playRepulsorBlast();
    AndroidIntentService.vibrate([200, 80, 250]);

    setArcPower((prev) => Math.max(70, prev - 8));

    setTimeout(() => {
      setIsFiringRepulsor(false);
      // Auto-recharge arc power slowly
      const recharge = setInterval(() => {
        setArcPower((p) => {
          if (p >= 100) {
            clearInterval(recharge);
            return 100;
          }
          return p + 2;
        });
      }, 300);
    }, 600);
  };

  const handleToggleTargetLock = () => {
    const nextState = !targetingLocked;
    setTargetingLocked(nextState);
    AndroidIntentService.vibrate(50);
    VoiceService.playHologramTone('listening');
    onSpeakProtocol?.(
      nextState
        ? 'Target lock acquired. Precision micro-missile silos standing by.'
        : 'Target lock disengaged. Returning to passive optical scan.'
    );
  };

  const handleToggleThermal = () => {
    const next = !thermalScanActive;
    setThermalScanActive(next);
    VoiceService.playHologramTone('confirm');
    AndroidIntentService.vibrate(40);
    onSpeakProtocol?.(
      next
        ? 'Thermal spectrum filters engaged. Heat signatures highlighted on HUD.'
        : 'Thermal filters offline. Standard optical spectrum restored.'
    );
  };

  const handleToggleSentry = () => {
    const next = !sentryMode;
    setSentryMode(next);
    AndroidIntentService.vibrate([60, 40, 60]);
    onSpeakProtocol?.(
      next
        ? 'Sentry Mode active. AYRA is monitoring perimeter and sensors.'
        : 'Sentry Mode deactivated. Full manual pilot control restored.'
    );
  };

  const handleRunDiagnostics = () => {
    VoiceService.playHologramTone('listening');
    AndroidIntentService.vibrate(80);
    onSpeakProtocol?.(
      activeLanguage === 'ur'
        ? 'تمام مارک آرمر سسٹمز، ری ایکٹر کور اور ریپلسرز ۱۰۰ فیصد پرفیکٹ کام کر رہے ہیں۔'
        : `All ${currentSuit.name} subroutines nominal. Arc reactor core stable at ${arcPower}%. Telemetry synchronized with JARVIS matrix.`
    );
  };

  return (
    <div className="space-y-4 font-tech text-slate-100 animate-fadeIn pb-12">
      {/* Top Cockpit Banner */}
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-[#040A18] via-[#06122C] to-[#040816] border ${currentSuit.borderClass} shadow-2xl relative overflow-hidden backdrop-blur-xl`}>
        {/* Glow corner elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#030712]/90 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-hud font-extrabold text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300">
                  {currentSuit.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 uppercase">
                  {currentSuit.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-tech">
                {currentSuit.tagline}
              </p>
            </div>
          </div>

          {/* Quick Diagnostics Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-hud text-xs tracking-wider transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>DIAGNOSTIC SCAN</span>
            </button>
          </div>
        </div>

        {/* Suit Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10">
          {(['mark_5', 'mark_45', 'mark_55', 'mark_85'] as MarkSuitModel[]).map((suitId) => {
            const suit = SUIT_PROFILES[suitId];
            const isSelected = selectedSuit === suitId;
            return (
              <button
                key={suitId}
                onClick={() => {
                  setSelectedSuit(suitId);
                  VoiceService.playHologramTone('confirm');
                  AndroidIntentService.vibrate(30);
                  onSpeakProtocol?.(`Switching telemetry profile to ${suit.name}. Systems online.`);
                }}
                className={`flex flex-col p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? `bg-[#081534] ${suit.borderClass} shadow-lg ${suit.glowClass} scale-102`
                    : 'bg-[#030816]/70 border-white/10 hover:border-white/30 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-hud font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {suit.name.split(' ')[0]} {suit.name.split(' ')[1]}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1 font-tech">
                  {suit.specialty.split(',')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Arc Reactor & Armor Subsystems */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Arc Reactor Core & Repulsor Firing Pad */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#050C1F]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl flex flex-col items-center justify-between relative overflow-hidden">
          {/* Subtle background radar circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-72 h-72 rounded-full border border-cyan-400/30" />
            <div className="w-96 h-96 rounded-full border border-cyan-400/20" />
          </div>

          <div className="w-full flex items-center justify-between pb-2 border-b border-cyan-500/20 z-10">
            <span className="text-xs font-hud text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Power className="w-4 h-4 text-cyan-400" />
              <span>ARC REACTOR CORE</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              OUTPUT: {arcPower}%
            </span>
          </div>

          {/* Interactive Glowing Arc Reactor Graphic */}
          <div className="relative my-6 flex items-center justify-center cursor-pointer select-none group" onClick={handleChargeRepulsor}>
            {/* Blast Wave overlay when fired */}
            {isFiringRepulsor && (
              <div className="absolute w-80 h-80 rounded-full bg-cyan-400/40 animate-ping pointer-events-none" />
            )}

            {/* Outer Rotating Ring */}
            <div className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 border-dashed border-cyan-400/50 flex items-center justify-center transition-transform duration-700 ${isCharging ? 'animate-spin' : ''}`}>
              {/* Mid Ring */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-cyan-300/60 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                {/* Copper Coils simulation */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-amber-500/80 flex items-center justify-center bg-radial from-cyan-400/30 via-[#03091E] to-[#01030A]">
                  {/* Glowing Core */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-300 to-white flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.9)] transition-all ${
                    isCharging ? 'scale-110 shadow-[0_0_80px_rgba(0,240,255,1)]' : ''
                  }`}>
                    <Zap className="w-8 h-8 text-slate-950 fill-current" />
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction tooltip badge */}
            <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-[#030714]/90 border border-cyan-400/60 text-[10px] font-tech text-cyan-300 tracking-wider shadow-lg">
              {isCharging ? '⚡ CHARGING RECTIFIER...' : repulsorCharged ? 'READY TO DISCHARGE' : 'TAP CORE TO CHARGE'}
            </div>
          </div>

          {/* Tactical Action Pad: Charge & Fire Repulsors */}
          <div className="w-full grid grid-cols-2 gap-2.5 z-10 pt-2">
            <button
              onClick={handleChargeRepulsor}
              disabled={isCharging}
              className={`p-3 rounded-xl font-hud font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                isCharging
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-[#081534] hover:bg-[#0c204c] border border-cyan-500/40 text-cyan-300 hover:text-white shadow-md'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{isCharging ? 'CHARGING...' : 'CHARGE REPULSOR'}</span>
            </button>

            <button
              onClick={handleFireRepulsor}
              disabled={!repulsorCharged || isFiringRepulsor}
              className={`p-3 rounded-xl font-hud font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                repulsorCharged
                  ? 'bg-gradient-to-r from-red-500 to-cyan-500 hover:from-red-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/40 animate-pulse'
                  : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>{isFiringRepulsor ? 'FIRING!' : 'FIRE UNIBEAM'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Subsystems, Targeting & Flight Gyroscopes */}
        <div className="lg:col-span-7 space-y-4">
          {/* Subsystems Status Matrix */}
          <div className="p-4 rounded-2xl bg-[#050C1F]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/20">
              <span className="text-xs font-hud text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>ARMOR INTEGRITY & DIAGNOSTIC MATRIX</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ALL SUBSYSTEMS NOMINAL</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {subsystems.map((sub) => (
                <div key={sub.id} className="p-2.5 rounded-xl bg-[#040816] border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-tech">{sub.name}</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-300">{sub.integrity}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#0A1838] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        sub.integrity > 80 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${sub.integrity}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-tech">
                    <span>{sub.location}</span>
                    <span className="text-cyan-400/80 truncate max-w-[140px]">{sub.spec}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Controls & Telemetry HUD */}
          <div className="p-4 rounded-2xl bg-[#050C1F]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <span className="text-xs font-hud text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>FLIGHT SENSORS & TACTICAL TOGGLES</span>
              </span>
              <span className="text-[10px] font-tech text-slate-400">
                PITCH: {gyro.pitch}° | ROLL: {gyro.roll}° | YAW: {gyro.yaw}°
              </span>
            </div>

            {/* Tactical Toggle Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleToggleTargetLock}
                className={`p-2.5 rounded-xl font-hud text-xs font-bold tracking-wider flex flex-col items-center gap-1 border transition-all ${
                  targetingLocked
                    ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/30 animate-pulse'
                    : 'bg-[#060E22] border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-400/50'
                }`}
              >
                <Crosshair className={`w-4 h-4 ${targetingLocked ? 'text-red-400' : 'text-cyan-400'}`} />
                <span>{targetingLocked ? 'TARGET LOCKED' : 'TARGET SCAN'}</span>
              </button>

              <button
                onClick={handleToggleThermal}
                className={`p-2.5 rounded-xl font-hud text-xs font-bold tracking-wider flex flex-col items-center gap-1 border transition-all ${
                  thermalScanActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/30'
                    : 'bg-[#060E22] border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-400/50'
                }`}
              >
                <Flame className={`w-4 h-4 ${thermalScanActive ? 'text-amber-400' : 'text-cyan-400'}`} />
                <span>{thermalScanActive ? 'THERMAL ON' : 'THERMAL SCAN'}</span>
              </button>

              <button
                onClick={handleToggleSentry}
                className={`p-2.5 rounded-xl font-hud text-xs font-bold tracking-wider flex flex-col items-center gap-1 border transition-all ${
                  sentryMode
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/30'
                    : 'bg-[#060E22] border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-400/50'
                }`}
              >
                <Radio className={`w-4 h-4 ${sentryMode ? 'text-emerald-400' : 'text-cyan-400'}`} />
                <span>{sentryMode ? 'SENTRY ACTIVE' : 'SENTRY MODE'}</span>
              </button>
            </div>

            {/* Live Stats Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
              <div className="p-2 rounded-xl bg-[#030816] border border-cyan-500/20">
                <span className="text-[9px] font-hud text-slate-400 uppercase block">CORE TEMP</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{telemetry.coreTemp}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#030816] border border-cyan-500/20">
                <span className="text-[9px] font-hud text-slate-400 uppercase block">BATTERY CELL</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{telemetry.battery}% ({telemetry.voltage})</span>
              </div>
              <div className="p-2 rounded-xl bg-[#030816] border border-cyan-500/20">
                <span className="text-[9px] font-hud text-slate-400 uppercase block">THRUST MAX</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{telemetry.thrustOutput}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#030816] border border-cyan-500/20">
                <span className="text-[9px] font-hud text-slate-400 uppercase block">NANITE DENSITY</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{telemetry.naniteReserve}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
