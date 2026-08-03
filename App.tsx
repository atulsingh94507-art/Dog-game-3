import React, { useState, useEffect } from 'react';
import { GameState, GameStats, DogBreedId, AccessoryId } from './types';
import { INITIAL_DOG_BREEDS, INITIAL_ACCESSORIES } from './data/dogBreeds';
import { FlappyDogCanvas } from './components/FlappyDogCanvas';
import { HUD } from './components/HUD';
import { StartOverlay } from './components/StartOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { PupShopModal } from './components/PupShopModal';
import { InstructionsModal } from './components/InstructionsModal';
import { StatsModal } from './components/StatsModal';
import { soundManager } from './utils/audio';

const STORAGE_KEY = 'flappy_ears_dog_stats_v1';

const DEFAULT_STATS: GameStats = {
  highScore: 0,
  totalBones: 0,
  gamesPlayed: 0,
  totalFlaps: 0,
  totalDistance: 0,
  unlockedBreeds: ['beagle'],
  unlockedAccessories: ['none'],
  selectedBreed: 'beagle',
  selectedAccessory: 'none',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState<number>(0);
  const [bonesCollected, setBonesCollected] = useState<number>(0);
  const [lives, setLives] = useState<number>(0);
  const [skyThemeLabel, setSkyThemeLabel] = useState<string>('☀️ Day');
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [activePowerup, setActivePowerup] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Stats & Store State
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback default
    }
    return DEFAULT_STATS;
  });

  // Save stats to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore
    }
  }, [stats]);

  // Derived Breed & Accessory lists
  const breeds = INITIAL_DOG_BREEDS.map((b) => ({
    ...b,
    unlocked: stats.unlockedBreeds.includes(b.id),
  }));

  const accessories = INITIAL_ACCESSORIES.map((a) => ({
    ...a,
    unlocked: stats.unlockedAccessories.includes(a.id),
  }));

  const selectedBreed = breeds.find((b) => b.id === stats.selectedBreed) || breeds[0];
  const selectedAccessory = accessories.find((a) => a.id === stats.selectedAccessory) || accessories[0];

  const [reviveCountThisRun, setReviveCountThisRun] = useState<number>(0);
  const [isReviveRequested, setIsReviveRequested] = useState<boolean>(false);
  const MAX_REVIVES = 2;

  // Start Playing
  const handleStartGame = (initialScore: number | unknown = 0) => {
    const startScore = typeof initialScore === 'number' ? initialScore : 0;
    setScore(startScore);
    setBonesCollected(0);
    setLives(0);
    setSkyThemeLabel('☀️ Day');
    setIsNewHighScore(false);
    setActivePowerup(null);
    setReviveCountThisRun(0);
    setIsReviveRequested(false);
    setGameState('PLAYING');
    soundManager.startBackgroundMusic();

    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
    }));
  };

  // Revive Handler (Max 2 Revives Per Game)
  const handleRevive = () => {
    if (reviveCountThisRun >= MAX_REVIVES) return;
    const cost = 5;
    if (stats.totalBones >= cost) {
      setStats((prev) => ({
        ...prev,
        totalBones: prev.totalBones - cost,
      }));
    }
    setReviveCountThisRun((prev) => prev + 1);
    setIsReviveRequested(true);
    setGameState('PLAYING');
    soundManager.startBackgroundMusic();
  };

  // Score Increment
  const handleScoreIncrement = () => {
    setScore((prev) => prev + 1);
  };

  // Bone Collected
  const handleBoneCollected = (isGolden: boolean) => {
    const amount = isGolden ? 5 : 1;
    setBonesCollected((prev) => prev + amount);
    setStats((prev) => ({
      ...prev,
      totalBones: prev.totalBones + amount,
    }));
  };

  // Powerup Banner
  const handlePowerupCollected = (powerupName: string) => {
    setActivePowerup(powerupName);
    setTimeout(() => {
      setActivePowerup((curr) => (curr === powerupName ? null : curr));
    }, 3000);
  };

  // Game Over
  const handleGameOver = (finalScore: number, finalBones: number) => {
    soundManager.stopBackgroundMusic();
    setGameState('GAMEOVER');

    let newRecord = false;
    if (finalScore > stats.highScore) {
      newRecord = true;
      setIsNewHighScore(true);
    }

    setStats((prev) => ({
      ...prev,
      highScore: Math.max(prev.highScore, finalScore),
    }));
  };

  // Mute Toggle
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
  };

  // Pause Toggle
  const handleTogglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      soundManager.stopBackgroundMusic();
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      soundManager.startBackgroundMusic();
    }
  };

  // Shop Unlock & Equip Handlers
  const handleSelectBreed = (id: DogBreedId) => {
    setStats((prev) => ({ ...prev, selectedBreed: id }));
  };

  const handleUnlockBreed = (id: DogBreedId, cost: number) => {
    if (stats.totalBones >= cost && !stats.unlockedBreeds.includes(id)) {
      setStats((prev) => ({
        ...prev,
        totalBones: prev.totalBones - cost,
        unlockedBreeds: [...prev.unlockedBreeds, id],
        selectedBreed: id,
      }));
    }
  };

  const handleSelectAccessory = (id: AccessoryId) => {
    setStats((prev) => ({ ...prev, selectedAccessory: id }));
  };

  const handleUnlockAccessory = (id: AccessoryId, cost: number) => {
    if (stats.totalBones >= cost && !stats.unlockedAccessories.includes(id)) {
      setStats((prev) => ({
        ...prev,
        totalBones: prev.totalBones - cost,
        unlockedAccessories: [...prev.unlockedAccessories, id],
        selectedAccessory: id,
      }));
    }
  };

  const handleResetStats = () => {
    if (confirm('Reset all high scores and unlocked breeds?')) {
      setStats(DEFAULT_STATS);
      localStorage.removeItem(STORAGE_KEY);
      setIsStatsOpen(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Game Outer Shell Container */}
      <div className="relative w-full h-full max-w-2xl max-h-[900px] bg-slate-900 shadow-2xl overflow-hidden sm:rounded-3xl border border-slate-800">
        {/* Canvas Render Surface */}
        <FlappyDogCanvas
          gameState={gameState}
          selectedBreed={selectedBreed}
          selectedAccessory={selectedAccessory}
          onScoreIncrement={handleScoreIncrement}
          onBoneCollected={handleBoneCollected}
          onPowerupCollected={handlePowerupCollected}
          onLivesChange={(l) => setLives(l)}
          onSkyThemeChange={(label) => setSkyThemeLabel(label)}
          onVictory={(finalScore, finalBones) => handleGameOver(finalScore, finalBones)}
          onGameOver={handleGameOver}
          isMuted={isMuted}
          score={score}
          bonesCollected={bonesCollected}
          isReviveRequested={isReviveRequested}
          onReviveHandled={() => setIsReviveRequested(false)}
        />

        {/* HUD Layer (When playing or paused) */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <HUD
            score={score}
            bones={bonesCollected}
            lives={lives}
            skyThemeLabel={skyThemeLabel}
            highScore={stats.highScore}
            selectedBreed={selectedBreed}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isPaused={gameState === 'PAUSED'}
            onTogglePause={handleTogglePause}
            activePowerup={activePowerup}
          />
        )}

        {/* Start Overlay */}
        {gameState === 'START' && (
          <StartOverlay
            onStart={() => handleStartGame(0)}
            onStartAtScore={(s) => handleStartGame(s)}
            selectedBreed={selectedBreed}
            selectedAccessory={selectedAccessory}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
            onOpenStats={() => setIsStatsOpen(true)}
            highScore={stats.highScore}
            totalBones={stats.totalBones}
          />
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAMEOVER' && (
          <GameOverOverlay
            score={score}
            bonesCollected={bonesCollected}
            highScore={stats.highScore}
            isNewHighScore={isNewHighScore}
            totalBones={stats.totalBones}
            reviveCountThisRun={reviveCountThisRun}
            maxRevives={MAX_REVIVES}
            onRevive={handleRevive}
            onRestart={() => handleStartGame(0)}
            onOpenShop={() => setIsShopOpen(true)}
            selectedBreed={selectedBreed}
          />
        )}

        {/* Modals */}
        {isShopOpen && (
          <PupShopModal
            breeds={breeds}
            accessories={accessories}
            selectedBreedId={stats.selectedBreed}
            selectedAccessoryId={stats.selectedAccessory}
            totalBones={stats.totalBones}
            onSelectBreed={handleSelectBreed}
            onUnlockBreed={handleUnlockBreed}
            onSelectAccessory={handleSelectAccessory}
            onUnlockAccessory={handleUnlockAccessory}
            onClose={() => setIsShopOpen(false)}
          />
        )}

        {isInstructionsOpen && (
          <InstructionsModal onClose={() => setIsInstructionsOpen(false)} />
        )}

        {isStatsOpen && (
          <StatsModal
            stats={stats}
            onResetStats={handleResetStats}
            onClose={() => setIsStatsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
