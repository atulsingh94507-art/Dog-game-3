import React from 'react';
import { X, HelpCircle, Shield, Magnet, Zap } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-amber-400">HOW TO PLAY</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
            id="instructions-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300 custom-scrollbar">
          {/* Controls Box */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
            <h3 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">Flight Controls</h3>
            <p className="text-xs">
              Press <kbd className="px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded">SPACE</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded">UP ARROW</kbd>, Left-Click, or Tap the screen to flap your giant ears and gain altitude!
            </p>
          </div>

          {/* Power-ups Guide */}
          <div className="space-y-2.5">
            <h3 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">Power-ups & Collectibles</h3>

            <div className="flex items-start space-x-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <span className="text-2xl">🦴</span>
              <div>
                <h4 className="font-bold text-white text-xs">Tasty Bones</h4>
                <p className="text-xs text-slate-400">Collect bones to spend in the Pup Shop on new dog breeds & ear accessories!</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <Shield className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs">Tennis Ball Shield</h4>
                <p className="text-xs text-slate-400">Protects your pup from 1 crash against hydrants or obstacles.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <Magnet className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs">Steak Magnet</h4>
                <p className="text-xs text-slate-400">Pulls all nearby bones directly towards your flying pup!</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <Zap className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs">Sausage Rocket Boost</h4>
                <p className="text-xs text-slate-400">Grants temporary rainbow speed and invincibility!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
