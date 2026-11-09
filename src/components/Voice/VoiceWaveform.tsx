import React, { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  color?: string;
  height?: number;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening,
  isSpeaking,
  color = '#00F0FF',
  height = 70,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      phase += isSpeaking ? 0.08 : isListening ? 0.12 : 0.03;
      const width = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, width, h);

      // Number of bars
      const barsCount = 38;
      const barWidth = width / barsCount - 3;

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + 3);
        const norm = (i / barsCount) * Math.PI * 2;

        let amplitude = 4;
        if (isSpeaking) {
          // Melodic smooth wave with harmonic variance
          amplitude = Math.abs(Math.sin(norm * 2 + phase) * Math.cos(norm * 3 + phase * 0.7)) * (h * 0.42) + 6;
        } else if (isListening) {
          // High reactive dynamic jitter
          const noise = (Math.sin(i * 1.5 + phase * 3) + 1) * 0.5;
          amplitude = noise * (h * 0.48) + 8;
        } else {
          // Idle rhythmic pulse
          amplitude = Math.sin(norm + phase) * 4 + 5;
        }

        const barHeight = Math.max(3, amplitude);
        const y = midY - barHeight / 2;

        // Gradient for each bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isListening) {
          gradient.addColorStop(0, '#00F0FF');
          gradient.addColorStop(0.5, '#00FF9D');
          gradient.addColorStop(1, '#0066FF');
        } else if (isSpeaking) {
          gradient.addColorStop(0, '#FF007F');
          gradient.addColorStop(0.5, '#9D4EDD');
          gradient.addColorStop(1, '#00F0FF');
        } else {
          gradient.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 102, 255, 0.2)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(2, barWidth), barHeight, 2);
        ctx.fill();
      }

      // Center glowing holographic centerline
      ctx.beginPath();
      ctx.strokeStyle = isListening ? 'rgba(0, 255, 157, 0.6)' : isSpeaking ? 'rgba(157, 78, 221, 0.6)' : 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isListening, isSpeaking, color]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full relative flex items-center justify-center bg-black/40 border border-cyan-500/20 rounded-xl p-2 backdrop-blur-sm shadow-inner overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        <canvas
          ref={canvasRef}
          width={400}
          height={height}
          className="w-full h-[54px] md:h-[64px]"
        />

        {/* Status badges inside waveform */}
        <div className="absolute top-1.5 left-3 flex items-center gap-1.5 text-[9px] font-tech text-cyan-400/80 tracking-widest uppercase">
          <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : isSpeaking ? 'bg-purple-400 animate-pulse' : 'bg-cyan-500/50'}`} />
          {isListening ? 'AUDIO INPUT ACTIVE [MIC ON]' : isSpeaking ? 'MAYA SYNTHESIZING VOICE' : 'AUDIO HUD IDLE'}
        </div>

        <div className="absolute bottom-1 right-3 text-[9px] font-hud text-slate-500">
          48.0 kHz • STEREO 24-BIT
        </div>
      </div>
    </div>
  );
};
