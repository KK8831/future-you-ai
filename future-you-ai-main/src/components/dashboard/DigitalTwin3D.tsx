import React from "react";
import { Activity, Brain, Heart, Wind } from "lucide-react";

export const DigitalTwin3D = ({ highlights }: { highlights: any[] }) => {
  // Map highlights to a highly stylized 2D holographic view
  const hasBrain = highlights.some(h => h.zone === "brain");
  const hasHeart = highlights.some(h => h.zone === "heart");
  const hasLungs = highlights.some(h => h.zone === "chest");
  const hasLegs = highlights.some(h => h.zone === "legs");

  return (
    <div className="w-full h-full min-h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-white/5 shadow-inner relative flex items-center justify-center group isolate">
      
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e90a_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90a_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[80px] opacity-50 mix-blend-screen group-hover:opacity-70 transition-opacity duration-700"></div>

      {/* Hologram Scanner Line */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="h-[2px] w-full bg-accent/50 shadow-[0_0_8px_2px_rgba(45,212,191,0.4)] animate-[scan_4s_ease-in-out_infinite]"></div>
      </div>

      {/* Main Holographic Body Wrapper */}
      <div className="relative w-48 h-[280px] z-20 flex items-center justify-center">
        
        {/* Abstract Silhouette */}
        <svg viewBox="0 0 100 200" className="w-full h-full absolute inset-0 text-slate-700/40 drop-shadow-[0_0_15px_rgba(51,65,85,0.5)]">
          <path d="M50 15 C44 15 40 19 40 25 C40 31 44 35 50 35 C56 35 60 31 60 25 C60 19 56 15 50 15 Z" fill="currentColor"/>
          <path d="M35 40 C43 40 57 40 65 40 C75 40 80 50 80 60 C80 75 75 90 70 100 L65 190 C65 195 60 195 55 195 C50 195 50 190 50 180 L50 110 L50 180 C50 190 50 195 45 195 C40 195 35 195 35 190 L30 100 C25 90 20 75 20 60 C20 50 25 40 35 40 Z" fill="currentColor"/>
        </svg>

        {/* Brain Node */}
        <div className={`absolute top-[8%] flex flex-col items-center transition-all duration-500 ${hasBrain ? 'scale-110' : 'scale-90 opacity-40'}`}>
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border border-white/20 backdrop-blur-md ${hasBrain ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-800/50'}`}>
            <Brain className={`w-4 h-4 ${hasBrain ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            {hasBrain && <span className="absolute -right-2 -top-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>}
          </div>
          {hasBrain && <span className="mt-1 text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">Cognitive</span>}
        </div>

        {/* Heart Node */}
        <div className={`absolute top-[28%] left-[55%] flex flex-col items-center transition-all duration-500 ${hasHeart ? 'scale-110' : 'scale-100 opacity-80'}`}>
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border border-white/20 backdrop-blur-md ${hasHeart ? 'bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-accent/10 shadow-[0_0_10px_rgba(45,212,191,0.3)]'}`}>
            <Heart className={`w-5 h-5 ${hasHeart ? 'text-red-400 animate-pulse' : 'text-accent animate-pulse-slow'}`} />
            {hasHeart && <span className="absolute -right-2 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>}
          </div>
          <span className={`mt-1 text-[9px] font-mono font-bold uppercase tracking-wider ${hasHeart ? 'text-red-400' : 'text-accent'}`}>
            {hasHeart ? 'Elevated' : 'Stable'}
          </span>
        </div>

        {/* Lung/Chest Node */}
        <div className={`absolute top-[32%] right-[55%] flex flex-col items-center transition-all duration-500 ${hasLungs ? 'scale-110' : 'scale-90 opacity-40'}`}>
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border border-white/20 backdrop-blur-md ${hasLungs ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-800/50'}`}>
            <Wind className={`w-4 h-4 ${hasLungs ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          </div>
          {hasLungs && <span className="mt-1 text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">Respiratory</span>}
        </div>

        {/* Activity/Legs Node */}
        <div className={`absolute bottom-[20%] flex flex-col items-center transition-all duration-500 ${hasLegs ? 'scale-110' : 'scale-90 opacity-40'}`}>
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border border-white/20 backdrop-blur-md ${hasLegs ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-800/50'}`}>
            <Activity className={`w-4 h-4 ${hasLegs ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
          </div>
          {hasLegs && <span className="mt-1 text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">Movement</span>}
        </div>
      </div>

      {/* UI Overlays */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
          <span className="text-[10px] text-white font-mono uppercase tracking-widest font-bold">Holographic Link</span>
        </div>
        <span className="text-[9px] text-white/40 font-mono tracking-tighter uppercase pl-3.5">Real-time Biometrics</span>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-xl backdrop-blur-md border border-white/10 shadow-lg group-hover:border-accent/40 transition-colors duration-500">
        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Sync Status: <span className="text-accent">Active</span></span>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
