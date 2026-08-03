import React from 'react';
import { Volume2, VolumeX, Pause, Play, Shield, Magnet, Zap, Heart } from 'lucide-react';
import { DogBreed } from '../types';
import { getDogRank } from '../utils/ranks';

interface HUDProps {
  score: number;
  bones: number;
  lives?: number;
  skyThemeLabel?: string;
  highScore: number;
  selectedBreed: DogBreed;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  activePowerup: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  bones,
  lives = 0,
  skyThemeLabel = '☀️ Day',
  highScore,
  selectedBreed,
  isMuted,
  onToggleMute,
  isPaused,
  onTogglePause,
  activePowerup,
}) => {
  const currentRank = getDogRank(score);

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 flex flex-col justify-between select-none z-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between w-full gap-2">
        {/* Left Stats: Score, Bones & Lives */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Main Score Display */}
          <div className="bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border border-white/10 shadow-lg flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-bold">Pillars</span>
            <span className="text-xl sm:text-2xl font-black text-white">{score}</span>
          </div>

          {/* Bones Counter */}
          <div className="bg-amber-500/90 text-slate-950 font-extrabold px-3 py-1.5 sm:py-2 rounded-2xl shadow-lg border border-amber-300 flex items-center space-x-1">
            <span className="text-base sm:text-lg">🦴</span>
            <span className="text-base sm:text-lg">{bones}</span>
          </div>

          {/* Lives Display (Appears when lives > 0 or after 400 pillars) */}
          {lives > 0 && (
            <div className="bg-rose-500/90 text-white font-black px-3 py-1.5 sm:py-2 rounded-2xl shadow-lg border border-rose-300 flex items-center space-x-1 animate-pulse">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white" />
              <span className="text-sm sm:text-base">x{lives}</span>
            </div>
          )}
        </div>

        {/* Center: Rank Badge & Sky Atmosphere */}
        <div className="flex items-center space-x-2">
          {/* Current Rank Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/30 flex items-center space-x-1.5 shadow-md">
            <span className="text-sm">{currentRank.badge}</span>
            <span className={`text-xs font-bold ${currentRank.color}`}>{currentRank.title}</span>
          </div>

          {/* Time of Day Indicator */}
          <div className="hidden sm:flex items-center bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 text-xs font-semibold text-slate-300">
            <span>{skyThemeLabel}</span>
          </div>
        </div>

        {/* Right Action Controls: Mute & Pause */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 pointer-events-auto">

          {/* Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 sm:p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-white/10 transition-transform active:scale-95 shadow-md"
            title={isMuted ? 'Unmute' : 'Mute'}
            id="hud-mute-btn"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          </button>

          {/* Pause Toggle */}
          <button
            onClick={onTogglePause}
            className="p-2 sm:p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center"
            title={isPaused ? 'Resume' : 'Pause'}
            id="hud-pause-btn"
          >
            {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
          </button>
        </div>
      </div>

      {/* Middle Active Power-Up / Rank Banner */}
      {activePowerup && (
        <div className="self-center max-w-xs sm:max-w-md text-center bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black px-4 py-2 rounded-full shadow-2xl border-2 border-amber-200 animate-bounce flex items-center justify-center space-x-2 text-xs sm:text-sm">
          {activePowerup.includes('Shield') && <Shield className="w-4 h-4 shrink-0" />}
          {activePowerup.includes('Magnet') && <Magnet className="w-4 h-4 shrink-0" />}
          {activePowerup.includes('Sausage') && <Zap className="w-4 h-4 shrink-0" />}
          {activePowerup.includes('LIFE') && <Heart className="w-4 h-4 shrink-0 fill-current text-rose-950" />}
          <span className="truncate">{activePowerup}</span>
        </div>
      )}

      {/* Bottom High Score & Breed info */}
      <div className="flex items-end justify-between w-full">
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900/70 backdrop-blur-sm text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10">
            BEST: <span className="text-amber-400 font-bold">{highScore}</span>
          </div>
          <div className="hidden sm:block text-xs font-semibold text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/5">
            🐕 {selectedBreed.name}
          </div>
        </div>

        {/* Touch FLAP button for touch/mobile devices */}
        <div className="pointer-events-auto sm:hidden">
          <button
            className="bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-xl border-2 border-amber-200 active:scale-90 transition-transform uppercase tracking-wide flex items-center space-x-1.5"
            id="mobile-flap-btn"
          >
            <span>FLAP EARS!</span>
            <span>🪽</span>
          </button>
        </div>
      </div>
    </div>
  );
};

