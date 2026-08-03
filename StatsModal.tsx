import React from 'react';
import { X, Trophy, Hash, Compass, RotateCcw } from 'lucide-react';
import { GameStats } from '../types';

interface StatsModalProps {
  stats: GameStats;
  onResetStats: () => void;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onResetStats, onClose }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-amber-400">FLIGHT STATS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
            id="stats-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Best Score</span>
            <span className="text-2xl font-black text-amber-400">{stats.highScore}</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bones</span>
            <span className="text-2xl font-black text-amber-300">{stats.totalBones} 🦴</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Games Played</span>
            <span className="text-xl font-bold text-slate-200 flex items-center space-x-1">
              <Hash className="w-4 h-4 text-slate-400" />
              <span>{stats.gamesPlayed}</span>
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Flaps</span>
            <span className="text-xl font-bold text-slate-200 flex items-center space-x-1">
              <Compass className="w-4 h-4 text-slate-400" />
              <span>{stats.totalFlaps}</span>
            </span>
          </div>
        </div>

        <button
          onClick={onResetStats}
          className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 transition-colors flex items-center justify-center space-x-1"
          id="stats-reset-btn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Local Records</span>
        </button>
      </div>
    </div>
  );
};
