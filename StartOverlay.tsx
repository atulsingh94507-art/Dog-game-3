import React, { useState, useEffect } from 'react';
import { Play, ShoppingBag, HelpCircle, Trophy, Sparkles, Download } from 'lucide-react';
import { DogBreed, Accessory } from '../types';

interface StartOverlayProps {
  onStart: () => void;
  onStartAtScore?: (score: number) => void;
  selectedBreed: DogBreed;
  selectedAccessory: Accessory;
  onOpenShop: () => void;
  onOpenInstructions: () => void;
  onOpenStats: () => void;
  highScore: number;
  totalBones: number;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({
  onStart,
  onStartAtScore,
  selectedBreed,
  selectedAccessory,
  onOpenShop,
  onOpenInstructions,
  onOpenStats,
  highScore,
  totalBones,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-between p-6 z-20 text-white select-none overflow-y-auto">
      {/* Top Header Buttons */}
      <div className="w-full flex items-center justify-between max-w-md">
        {/* Total Bones Badge */}
        <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3.5 py-1.5 rounded-full text-sm font-bold flex items-center space-x-1.5 shadow-sm">
          <span>🦴</span>
          <span>{totalBones} Bones</span>
        </div>

        {/* Action icons: Instructions, Stats, Shop */}
        <div className="flex items-center space-x-2">
          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center space-x-1 text-xs"
              title="Install App"
              id="install-pwa-btn"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}
          <button
            onClick={onOpenStats}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-xl border border-white/10 transition-transform active:scale-95 shadow-md"
            title="Lifetime Stats"
            id="start-stats-btn"
          >
            <Trophy className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenInstructions}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/10 transition-transform active:scale-95 shadow-md"
            title="How to Play"
            id="start-help-btn"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenShop}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center space-x-1"
            title="Pup Shop"
            id="start-shop-btn"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs uppercase font-extrabold hidden sm:inline">Shop</span>
          </button>
        </div>
      </div>

      {/* Center Game Title & Dog Showcase */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Animated Main Title */}
        <div className="relative mb-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-3xl blur-xl opacity-40 animate-pulse"></div>
          <h1 className="relative text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 drop-shadow-md">
            FLAPPY EARS
          </h1>
          <div className="relative text-2xl sm:text-3xl font-black text-white tracking-widest uppercase flex items-center justify-center space-x-2 mt-1">
            <span>DOG</span>
            <span className="text-xl">🪽</span>
          </div>
        </div>

        {/* Selected Dog Visual Preview Frame */}
        <div className="relative my-4 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500/40 p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-xs w-full">
          <div className="absolute -top-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Ready to Fly</span>
          </div>

          {/* Dog Graphic Representation */}
          <div className="w-24 h-24 my-2 relative flex items-center justify-center">
            {/* Animated ear-flap simulation in CSS */}
            <div className="text-6xl animate-bounce">
              🐕
            </div>
            {selectedAccessory.id !== 'none' && (
              <span className="absolute -top-1 right-3 text-2xl">
                {selectedAccessory.icon}
              </span>
            )}
          </div>

          <h2 className="text-lg font-extrabold text-amber-300">{selectedBreed.name}</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 px-2 text-center">{selectedBreed.description}</p>

          {/* Quick Shop Change Dog Button */}
          <button
            onClick={onOpenShop}
            className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
            id="start-change-pup-btn"
          >
            Change Dog Breed / Accessories →
          </button>
        </div>

        {/* High Score Badge */}
        {highScore > 0 && (
          <div className="text-sm font-semibold text-slate-300 bg-slate-900/60 px-4 py-1.5 rounded-full border border-white/10 mb-4">
            🏆 BEST SCORE: <span className="text-amber-400 font-bold">{highScore}</span>
          </div>
        )}

        {/* Primary START PLAYING Button & Dog House Shortcut */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-xl font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all duration-200 uppercase tracking-wider border-2 border-amber-200"
            id="start-play-btn"
          >
            <Play className="w-7 h-7 mr-2 fill-current" />
            <span>FLAP & FLY!</span>
          </button>

          {onStartAtScore && (
            <button
              onClick={() => onStartAtScore(998)}
              className="px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-amber-300 text-xs font-black rounded-2xl border border-amber-500/40 hover:border-amber-400 active:scale-95 transition-all shadow-md flex items-center space-x-1.5"
              title="Start at 998 Pillars to test dog house"
              id="start-doghouse-demo-btn"
            >
              <span className="text-base">🏡</span>
              <div className="text-left">
                <div>DOG HOUSE DEMO</div>
                <div className="text-[10px] text-slate-400 font-normal">Start at 998 Pillars</div>
              </div>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">SPACE</kbd>, Click, or Tap to Flap Ears
        </p>
      </div>

      {/* Footer info & Direct Download */}
      <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
        <a
          href="/flappy-ears-dog-pwa.zip"
          download="flappy-ears-dog-pwa.zip"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-xs"
          id="download-project-zip-btn"
        >
          <Download className="w-4 h-4" />
          <span>Download Complete Project (.ZIP)</span>
        </a>
        <span>Flappy Ears Dog Arcade v1.0 • Ready to Play & Install</span>
      </div>
    </div>
  );
};
