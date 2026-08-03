import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, ShoppingBag, Share2, Sparkles, Heart } from 'lucide-react';
import { DogBreed } from '../types';
import { getDogRank } from '../utils/ranks';

interface GameOverOverlayProps {
  score: number;
  bonesCollected: number;
  highScore: number;
  isNewHighScore: boolean;
  totalBones: number;
  reviveCountThisRun: number;
  maxRevives: number;
  onRevive: () => void;
  onRestart: () => void;
  onOpenShop: () => void;
  selectedBreed: DogBreed;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  bonesCollected,
  highScore,
  isNewHighScore,
  totalBones,
  reviveCountThisRun,
  maxRevives,
  onRevive,
  onRestart,
  onOpenShop,
  selectedBreed,
}) => {
  const currentRank = getDogRank(score);
  const REVIVE_COST = 5;
  const revivesLeft = maxRevives - reviveCountThisRun;
  const canRevive = revivesLeft > 0;

  // Fire confetti on new record or reaching 1000 bones!
  useEffect(() => {
    if (isNewHighScore || score >= 1000) {
      try {
        confetti({
          particleCount: score >= 1000 ? 250 : 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899'],
        });
      } catch {
        // Ignore confetti fallback
      }
    }
  }, [isNewHighScore, score]);

  const handleShare = () => {
    const shareText = `I reached the rank of ${currentRank.badge} ${currentRank.title} with a score of ${score} pillars in Flappy Ears Dog! 🐕🪽`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 text-white select-none">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
        {/* New High Score Header Ribbon */}
        {score >= 1000 ? (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs px-4 py-1 rounded-b-xl uppercase tracking-widest shadow-md flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>🏡 VICTORY! HOME SWEET HOME!</span>
          </div>
        ) : isNewHighScore ? (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs px-4 py-1 rounded-b-xl uppercase tracking-widest shadow-md flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>NEW BEST RECORD!</span>
          </div>
        ) : null}

        {/* Dizzy or Happy Dog House Illustration */}
        <div className="text-5xl mt-3 mb-2 animate-bounce">
          {score >= 1000 ? '🏡🐶' : '🐶'}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
          {score >= 1000 ? 'ARRIVED AT DOG HOUSE!' : isNewHighScore ? 'PAW-SOME RECORD!' : 'OUCH! FELL DOWN'}
        </h2>
        
        {/* Achieved Rank Tag */}
        <div className="mt-1 inline-flex items-center space-x-1.5 bg-slate-800 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold">
          <span>{currentRank.badge}</span>
          <span className={currentRank.color}>{currentRank.title}</span>
        </div>

        {/* Score Card Box */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 my-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-sm font-semibold text-slate-300">Pillars Crossed</span>
            <span className="text-2xl font-black text-amber-400">{score}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-sm font-semibold text-slate-300">Bones Earned</span>
            <span className="text-lg font-bold text-amber-300 flex items-center">
              <span>🦴</span>
              <span className="ml-1">+{bonesCollected}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center">
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span>Personal Best</span>
            </span>
            <span className="font-bold text-white text-sm">{highScore}</span>
          </div>
        </div>

        {/* Action Buttons: Revive & Restart */}
        <div className="space-y-2.5">
          {/* Revive Button */}
          {canRevive ? (
            <button
              onClick={onRevive}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-pink-300/40 uppercase tracking-wider relative overflow-hidden group"
              id="gameover-revive-btn"
            >
              <Heart className="w-5 h-5 fill-current text-white animate-pulse" />
              <span>REVIVE & CONTINUE</span>
              <span className="ml-1 text-xs bg-black/40 px-2 py-0.5 rounded-full font-bold text-amber-300 border border-amber-300/40">
                {reviveCountThisRun === 0 ? 'FREE 💖' : `${REVIVE_COST} 🦴`} ({revivesLeft}/{maxRevives} left)
              </span>
            </button>
          ) : (
            <div className="py-2.5 px-3 bg-pink-950/40 border border-pink-500/30 rounded-xl text-pink-300 text-xs font-semibold flex items-center justify-center space-x-1.5">
              <Heart className="w-4 h-4 text-pink-400 fill-current" />
              <span>Max revives used for this game ({maxRevives}/{maxRevives})</span>
            </div>
          )}

          {/* Restart / New Game Button */}
          <button
            onClick={onRestart}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2 border border-amber-200 uppercase tracking-wider"
            id="gameover-restart-btn"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>NEW GAME</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenShop}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
              id="gameover-shop-btn"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Pup Shop</span>
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
              id="gameover-share-btn"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Share Rank</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


