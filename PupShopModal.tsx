import React, { useState } from 'react';
import { X, Check, Lock, Sparkles, ShoppingBag } from 'lucide-react';
import { DogBreed, Accessory, DogBreedId, AccessoryId } from '../types';

interface PupShopModalProps {
  breeds: DogBreed[];
  accessories: Accessory[];
  selectedBreedId: DogBreedId;
  selectedAccessoryId: AccessoryId;
  totalBones: number;
  onSelectBreed: (id: DogBreedId) => void;
  onUnlockBreed: (id: DogBreedId, cost: number) => void;
  onSelectAccessory: (id: AccessoryId) => void;
  onUnlockAccessory: (id: AccessoryId, cost: number) => void;
  onClose: () => void;
}

export const PupShopModal: React.FC<PupShopModalProps> = ({
  breeds,
  accessories,
  selectedBreedId,
  selectedAccessoryId,
  totalBones,
  onSelectBreed,
  onUnlockBreed,
  onSelectAccessory,
  onUnlockAccessory,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'breeds' | 'accessories'>('breeds');

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-400">PUP SHOP</h2>
              <p className="text-xs text-slate-400">Unlock flying dogs & cool ear gear!</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Bone Currency Balance */}
            <div className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-full text-sm flex items-center space-x-1 shadow-sm">
              <span>🦴</span>
              <span>{totalBones}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              id="shop-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('breeds')}
            className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
              activeTab === 'breeds'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
            id="tab-breeds-btn"
          >
            Dog Breeds (5)
          </button>
          <button
            onClick={() => setActiveTab('accessories')}
            className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
              activeTab === 'accessories'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
            id="tab-accessories-btn"
          >
            Ear Gear (5)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {activeTab === 'breeds' ? (
            /* BREEDS LIST */
            <div className="space-y-3">
              {breeds.map((breed) => {
                const isSelected = breed.id === selectedBreedId;
                const canAfford = totalBones >= breed.cost;

                return (
                  <div
                    key={breed.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : breed.unlocked
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-900/50 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl relative">
                        🐕
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-sm text-slate-200">{breed.name}</h3>
                          {isSelected && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{breed.description}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {breed.unlocked ? (
                        isSelected ? (
                          <button disabled className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-xl flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>EQUIPPED</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectBreed(breed.id)}
                            className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                            id={`select-breed-${breed.id}`}
                          >
                            EQUIP
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => onUnlockBreed(breed.id, breed.cost)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                          id={`unlock-breed-${breed.id}`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>{breed.cost} 🦴</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ACCESSORIES LIST */
            <div className="grid grid-cols-2 gap-3">
              {accessories.map((acc) => {
                const isSelected = acc.id === selectedAccessoryId;
                const canAfford = totalBones >= acc.cost;

                return (
                  <div
                    key={acc.id}
                    className={`p-3 rounded-2xl border flex flex-col justify-between items-center text-center transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : acc.unlocked
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-900/50 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="text-3xl my-2">{acc.icon}</div>
                    <h3 className="font-extrabold text-xs text-slate-200">{acc.name}</h3>

                    <div className="mt-3 w-full">
                      {acc.unlocked ? (
                        isSelected ? (
                          <button disabled className="w-full py-1 text-[11px] bg-amber-500/20 text-amber-300 font-bold rounded-lg flex items-center justify-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>EQUIPPED</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectAccessory(acc.id)}
                            className="w-full py-1 text-[11px] bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all active:scale-95"
                            id={`select-acc-${acc.id}`}
                          >
                            EQUIP
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => onUnlockAccessory(acc.id, acc.cost)}
                          disabled={!canAfford}
                          className={`w-full py-1 text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1 transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                          id={`unlock-acc-${acc.id}`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>{acc.cost} 🦴</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
