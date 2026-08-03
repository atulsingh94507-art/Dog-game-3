import React, { useEffect, useRef } from 'react';
import {
  GameState,
  DogBreed,
  Accessory,
  DogPosition,
  Obstacle,
  Collectible,
  Particle,
  ObstacleType,
} from '../types';
import { soundManager } from '../utils/audio';

interface FlappyDogCanvasProps {
  gameState: GameState;
  selectedBreed: DogBreed;
  selectedAccessory: Accessory;
  onScoreIncrement: () => void;
  onBoneCollected: (isGolden: boolean) => void;
  onPowerupCollected: (type: string) => void;
  onGameOver: (finalScore: number, finalBones: number) => void;
  onVictory?: (finalScore: number, finalBones: number) => void;
  onLivesChange?: (lives: number) => void;
  onSkyThemeChange?: (label: string) => void;
  onDistanceUpdate?: (dist: number) => void;
  isMuted: boolean;
  score: number;
  bonesCollected: number;
  isReviveRequested?: boolean;
  onReviveHandled?: () => void;
}

// Pipe gap logic:
// First 4 pillars: pipeGap = 180 (distance between top and bottom pipes)
// After 4 pillars: pipeGap tightens dynamically (e.g. 160, 170, 140, 120...) but NEVER lower than 100
function getSpeedAndGap(score: number) {
  const speed = 3.2 + Math.min(1.2, score * 0.015);
  let gap = 180; // Distance between top and bottom pipes for first 4 pillars

  if (score >= 4) {
    // After 4 pillars, gap narrows towards 120 with dynamic variance (170, 160, 140, 120, etc.)
    const baseGap = 180 - Math.min(60, (score - 4) * 3);
    const pseudoRandomVariation = ((score * 23) % 31) - 15; // ±15px variation per pillar
    gap = Math.max(100, Math.round(baseGap + pseudoRandomVariation));
  }

  return { speed, gap };
}

// Color interpolation helpers for smooth day-sunset-night transitions
function parseHex(hex: string) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bClamped = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bClamped})`;
}

interface SkyTheme {
  topColor: string;
  midColor: string;
  horizonColor: string;
  hillColor: string;
  grassColor: string;
  dirtColor: string;
  sunAlpha: number;
  moonAlpha: number;
  starAlpha: number;
  cloudColor: string;
  label: string;
}

// Dynamic Background Sky theme based on pillars crossed (score):
// 0 - 149: Day
// 150 - 399: Sunset (smooth transition starting after 150)
// 400 - 699: Night (starts at 400 pillars)
// 700+: Day (returns to bright day)
function getSkyThemeByScore(score: number): SkyTheme {
  if (score < 150) {
    // 1) DAY
    return {
      topColor: '#38BDF8',
      midColor: '#7DD3FC',
      horizonColor: '#FEF08A',
      hillColor: '#4ADE80',
      grassColor: '#22C55E',
      dirtColor: '#D97706',
      sunAlpha: 1.0,
      moonAlpha: 0,
      starAlpha: 0,
      cloudColor: 'rgba(255, 255, 255, 0.9)',
      label: '☀️ Day',
    };
  } else if (score < 400) {
    // 2) SUNSET (150 to 399)
    const t = Math.min(1, (score - 150) / 250);
    return {
      topColor: lerpColor('#38BDF8', '#4C1D95', t),
      midColor: lerpColor('#7DD3FC', '#C026D3', t),
      horizonColor: lerpColor('#FEF08A', '#F97316', t),
      hillColor: lerpColor('#4ADE80', '#15803D', t),
      grassColor: lerpColor('#22C55E', '#15803D', t),
      dirtColor: lerpColor('#D97706', '#92400E', t),
      sunAlpha: Math.max(0, 1.0 - t * 0.8),
      moonAlpha: t * 0.6,
      starAlpha: t * 0.6,
      cloudColor: lerpColor('rgba(255, 255, 255, 0.9)', '#FDBA74', t),
      label: '🌅 Sunset',
    };
  } else if (score < 700) {
    // 3) NIGHT (400 to 699)
    const t = Math.min(1, (score - 400) / 300);
    return {
      topColor: lerpColor('#4C1D95', '#020617', t),
      midColor: lerpColor('#C026D3', '#0F172A', t),
      horizonColor: lerpColor('#F97316', '#1E1B4B', t),
      hillColor: lerpColor('#15803D', '#064E3B', t),
      grassColor: lerpColor('#15803D', '#14532D', t),
      dirtColor: lerpColor('#92400E', '#78350F', t),
      sunAlpha: 0,
      moonAlpha: 1.0,
      starAlpha: 1.0,
      cloudColor: lerpColor('#FDBA74', '#94A3B8', t),
      label: '🌙 Night',
    };
  } else {
    // 4) DAY AGAIN (700+)
    const t = Math.min(1, (score - 700) / 300);
    return {
      topColor: lerpColor('#020617', '#38BDF8', t),
      midColor: lerpColor('#0F172A', '#7DD3FC', t),
      horizonColor: lerpColor('#1E1B4B', '#FEF08A', t),
      hillColor: lerpColor('#064E3B', '#4ADE80', t),
      grassColor: lerpColor('#14532D', '#22C55E', t),
      dirtColor: lerpColor('#78350F', '#D97706', t),
      sunAlpha: t,
      moonAlpha: Math.max(0, 1.0 - t * 2),
      starAlpha: Math.max(0, 1.0 - t * 2),
      cloudColor: lerpColor('#94A3B8', 'rgba(255, 255, 255, 0.9)', t),
      label: '☀️ Day',
    };
  }
}

interface DogHouse {
  x: number;
  y: number;
  width: number;
  height: number;
  arrived: boolean;
  celebrated: boolean;
}

export const FlappyDogCanvas: React.FC<FlappyDogCanvasProps> = ({
  gameState,
  selectedBreed,
  selectedAccessory,
  onScoreIncrement,
  onBoneCollected,
  onPowerupCollected,
  onGameOver,
  onDistanceUpdate,
  onLivesChange,
  onSkyThemeChange,
  onVictory,
  isMuted,
  score,
  bonesCollected,
  isReviveRequested = false,
  onReviveHandled,
  isGodMode = false,
  speedMultiplier = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Internal Game State References (for high 60fps render loop)
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const dogRef = useRef<DogPosition>({
    x: 100,
    y: 250,
    velocity: 0,
    rotation: 0,
    earAngle: 0.2,
    earTargetAngle: 0.2,
    earFlapVelocity: 0,
    shieldActive: false,
    shieldTimeLeft: 0,
    magnetActive: false,
    magnetTimeLeft: 0,
    boostActive: false,
    boostTimeLeft: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Environment Parallax Offsets & Distance Traveled
  const bgOffsetRef = useRef<number>(0);
  const groundOffsetRef = useRef<number>(0);
  const nextObstacleDistanceRef = useRef<number>(280);
  const distanceTraveledRef = useRef<number>(0);

  // Stars for night sky
  const starsRef = useRef<Array<{ x: number; y: number; size: number; phase: number }>>([]);
  if (starsRef.current.length === 0) {
    for (let i = 0; i < 45; i++) {
      starsRef.current.push({
        x: Math.random(),
        y: Math.random() * 0.55,
        size: 1 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Stats in current game run & milestone flags
  const scoreRef = useRef<number>(0);
  const bonesRef = useRef<number>(0);
  const livesGrantedRef = useRef<boolean>(false);
  const invulnerableTimeRef = useRef<number>(0);
  const lastRankNotifiedRef = useRef<number>(0);
  const dogHouseRef = useRef<DogHouse | null>(null);
  const shakeIntensityRef = useRef<number>(0);
  const lastSkyThemeRef = useRef<string>('');

  // Sync prop changes
  useEffect(() => {
    scoreRef.current = score;

    // Check if score crossed 400 pillars for 3 LIVES grant!
    if (score >= 400 && !livesGrantedRef.current) {
      livesGrantedRef.current = true;
      dogRef.current.lives = 3;
      if (onLivesChange) onLivesChange(3);
      soundManager.playPowerUpSound();
      onPowerupCollected('💖 3 LIVES UNLOCKED at 400 Pillars!');

      // Heart burst particle effect
      for (let p = 0; p < 20; p++) {
        particlesRef.current.push({
          x: dogRef.current.x,
          y: dogRef.current.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: 5 + Math.random() * 5,
          color: '#EC4899',
          alpha: 1,
          maxLife: 35,
          life: 35,
          shape: 'circle',
        });
      }
    }

    // Check every 100 milestone for rank upgrade toast
    const rankTier = Math.floor(score / 100);
    if (rankTier > lastRankNotifiedRef.current && rankTier > 0) {
      lastRankNotifiedRef.current = rankTier;
      soundManager.playPowerUpSound();
      if (score >= 1000) {
        onPowerupCollected('👑 GOD EMPEROR DOG - FINAL STAGE REACHED!');
        if (onVictory) onVictory(score, bonesRef.current);
      } else {
        onPowerupCollected(`🏆 NEW RANK AT ${score} PILLARS!`);
      }
    }
  }, [score, onLivesChange, onPowerupCollected, onVictory]);

  useEffect(() => {
    bonesRef.current = bonesCollected;
  }, [bonesCollected]);

  // Jump / Ear Flap Handler
  const handleFlap = () => {
    if (gameState !== 'PLAYING') return;

    soundManager.playFlapSound();

    const dog = dogRef.current;
    // On tap: crisp, controlled jump impulse (-240 px/s) for manageable flap height
    const jumpVel = dog.boostActive ? -300 : -240;
    dog.velocity = jumpVel;
    dog.rotation = -25 * (Math.PI / 180); // -25° upward tilt
    dog.earFlapVelocity = -2.5; // Flap ears upward

    // --- EAR-FLAP MOTION TRAIL & PARTICLES ---
    // 1) Crescent Ear-Swoosh Motion Trails
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x: dog.x - 14 - i * 6,
        y: dog.y - 12 + (Math.random() - 0.5) * 8,
        vx: -3.5 - Math.random() * 2.5,
        vy: -0.5 - Math.random() * 1.5,
        size: 7 - i * 1.2,
        color: selectedBreed.earColor,
        alpha: 0.85,
        maxLife: 22,
        life: 22,
        shape: 'ear_trail',
      });
    }

    // 2) Fluffy Velvet Inner-Ear Feathers
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x: dog.x - 10 - Math.random() * 8,
        y: dog.y - 10 + (Math.random() - 0.5) * 12,
        vx: -2.5 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 3,
        color: selectedBreed.earInnerColor,
        alpha: 0.9,
        maxLife: 18,
        life: 18,
        shape: 'feather',
      });
    }

    // 3) Speed / Wind Streak Lines
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x: dog.x - 18 - Math.random() * 10,
        y: dog.y - 6 + (Math.random() - 0.5) * 20,
        vx: -4.5 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 1.5,
        size: 2.2 + Math.random() * 2,
        color: '#FFFFFF',
        alpha: 0.65,
        maxLife: 15,
        life: 15,
        shape: 'wind_line',
      });
    }
  };

  // Reset Game Environment
  const resetGame = () => {
    dogRef.current = {
      x: 100,
      y: 250,
      velocity: 0,
      rotation: 0,
      earAngle: 0.2,
      earTargetAngle: 0.2,
      earFlapVelocity: 0,
      lives: 0,
      shieldActive: false,
      shieldTimeLeft: 0,
      magnetActive: false,
      magnetTimeLeft: 0,
      boostActive: false,
      boostTimeLeft: 0,
    };
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    bgOffsetRef.current = 0;
    groundOffsetRef.current = 0;
    nextObstacleDistanceRef.current = 200;
    livesGrantedRef.current = false;
    invulnerableTimeRef.current = 0;
    lastRankNotifiedRef.current = 0;
    dogHouseRef.current = null;
    if (onLivesChange) onLivesChange(0);
  };

  // Initialize / Revive game on state change
  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (isReviveRequested) {
        // Safe Revive Position & Temporary Shield Protection
        dogRef.current.y = 220;
        dogRef.current.velocity = -180;
        dogRef.current.rotation = -0.2;
        dogRef.current.shieldActive = true;
        dogRef.current.shieldTimeLeft = 3.0;
        invulnerableTimeRef.current = 3.0;

        // Clear obstacles in front of dog so player doesn't instantly re-collide
        obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.x > 320 || obs.x < -100);

        soundManager.playPowerUpSound();
        soundManager.playBarkSound();
        onPowerupCollected('💖 REVIVED! 3.0s SHIELD PROTECTION ACTIVE! 🪽');

        if (onReviveHandled) onReviveHandled();
      } else {
        resetGame();
      }
    }
  }, [gameState, isReviveRequested]);

  // Handle Keypress & Click controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Helper: Spawn Dog Leash obstacle with ~4 inch fixed gap
  const spawnObstacle = (canvasWidth: number, canvasHeight: number) => {
    const { gap } = getSpeedAndGap(scoreRef.current);
    const minHeight = 70;
    const maxHeight = canvasHeight - gap - 120; // leave ground space
    const topHeight = minHeight + Math.random() * Math.max(20, maxHeight - minHeight);
    const bottomHeight = canvasHeight - topHeight - gap - 60; // 60px ground height

    const leashTypes: ObstacleType[] = ['red_leash', 'blue_leash', 'leather_leash', 'neon_leash'];
    const chosenType = leashTypes[Math.floor(Math.random() * leashTypes.length)];

    obstaclesRef.current.push({
      x: canvasWidth + 50,
      width: 64,
      topHeight,
      bottomHeight,
      gap,
      passed: false,
      type: chosenType,
      colorTheme: {
        top: '#EF4444',
        bottom: '#DC2626',
        accent: '#F59E0B',
      },
    });

    // Spawn Bone or Power-up inside or near gap
    const gapCenterY = topHeight + gap / 2;
    const itemRoll = Math.random();

    if (itemRoll < 0.6) {
      // Regular Bone
      collectiblesRef.current.push({
        id: Math.random().toString(),
        x: canvasWidth + 50 + 34,
        y: gapCenterY + (Math.random() - 0.5) * 40,
        type: 'bone',
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    } else if (itemRoll < 0.78) {
      // Golden Bone
      collectiblesRef.current.push({
        id: Math.random().toString(),
        x: canvasWidth + 50 + 34,
        y: gapCenterY,
        type: 'golden_bone',
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    } else if (itemRoll < 0.86) {
      // Shield
      collectiblesRef.current.push({
        id: Math.random().toString(),
        x: canvasWidth + 50 + 34,
        y: gapCenterY,
        type: 'shield',
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    } else if (itemRoll < 0.93) {
      // Magnet
      collectiblesRef.current.push({
        id: Math.random().toString(),
        x: canvasWidth + 50 + 34,
        y: gapCenterY,
        type: 'magnet',
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    } else {
      // Sausage Boost
      collectiblesRef.current.push({
        id: Math.random().toString(),
        x: canvasWidth + 50 + 34,
        y: gapCenterY,
        type: 'sausage_boost',
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset timestamp tracker to prevent huge delta-time leaps on unpause / start
    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // cap delta time
      lastTimeRef.current = now;

      // Handle High-DPI crisp rendering scale
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const groundY = height - 60;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear canvas logical area
      ctx.clearRect(0, 0, width, height);

      // Apply Screen Shake offset if active
      if (shakeIntensityRef.current > 0.3) {
        const shakeX = (Math.random() - 0.5) * shakeIntensityRef.current;
        const shakeY = (Math.random() - 0.5) * shakeIntensityRef.current;
        ctx.translate(shakeX, shakeY);
        shakeIntensityRef.current *= 0.88; // Exponential dampening
      } else {
        shakeIntensityRef.current = 0;
      }

      // --- 1. DRAW PARALLAX BACKGROUND (Score-based Day / Sunset / Night / Day Cycle) ---
      const skyTheme = getSkyThemeByScore(scoreRef.current);
      if (skyTheme.label !== lastSkyThemeRef.current) {
        lastSkyThemeRef.current = skyTheme.label;
        if (onSkyThemeChange) onSkyThemeChange(skyTheme.label);
      }

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, skyTheme.topColor);
      skyGrad.addColorStop(0.5, skyTheme.midColor);
      skyGrad.addColorStop(1, skyTheme.horizonColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw Twinkling Night Stars if Night Sky
      if (skyTheme.starAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = skyTheme.starAlpha;
        for (const star of starsRef.current) {
          const alpha = 0.4 + 0.6 * Math.sin(now * 0.003 + star.phase);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Moon / Sun in Sky (Realistic Multi-Layered Solar Corona, Rays & Lens Flare)
      if (skyTheme.sunAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = skyTheme.sunAlpha;

        const sunX = width * 0.8;
        const sunY = height * 0.2;
        const pulse = Math.sin(now * 0.002) * 2;

        // 1. Atmospheric Outer Corona Glow
        const outerGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110 + pulse);
        outerGrad.addColorStop(0, 'rgba(255, 251, 235, 0.6)');
        outerGrad.addColorStop(0.25, 'rgba(253, 224, 71, 0.3)');
        outerGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.12)');
        outerGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 110 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Rotating Soft Solar Rays
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(now * 0.0003);
        const numRays = 12;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
        for (let i = 0; i < numRays; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const angle1 = (i * Math.PI * 2) / numRays;
          const angle2 = angle1 + 0.15;
          const rayLength = 95 + Math.sin(now * 0.002 + i) * 15;
          ctx.lineTo(Math.cos(angle1) * rayLength, Math.sin(angle1) * rayLength);
          ctx.lineTo(Math.cos(angle2) * rayLength, Math.sin(angle2) * rayLength);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // 3. Inner Solar Core with Radial Gradient
        const innerGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 28);
        innerGrad.addColorStop(0, '#FFFFFF'); // Hot white center
        innerGrad.addColorStop(0.35, '#FEF08A'); // Pale golden yellow
        innerGrad.addColorStop(0.8, '#FDE047'); // Warm sun
        innerGrad.addColorStop(1, '#F59E0B'); // Orange rim
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
        ctx.fill();

        // 4. Subtle Lens Flare Circles across the sky
        const flareDistances = [50, 95, 145, 210];
        const flareSizes = [6, 11, 8, 16];
        const flareColors = [
          'rgba(253, 224, 71, 0.18)',
          'rgba(249, 115, 22, 0.12)',
          'rgba(59, 130, 246, 0.1)',
          'rgba(236, 72, 153, 0.08)',
        ];

        flareDistances.forEach((dist, idx) => {
          const fx = sunX - dist * 0.85;
          const fy = sunY + dist * 0.55;
          ctx.fillStyle = flareColors[idx];
          ctx.beginPath();
          ctx.arc(fx, fy, flareSizes[idx] + Math.sin(now * 0.002 + idx) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      } else if (skyTheme.moonAlpha > 0) {
        // Glowing Crescent Moon
        ctx.save();
        ctx.globalAlpha = skyTheme.moonAlpha;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.22, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.22, 24, 0, Math.PI * 2);
        ctx.fill();
        // Crescent cutout
        ctx.fillStyle = skyTheme.topColor;
        ctx.beginPath();
        ctx.arc(width * 0.8 - 8, height * 0.22 - 4, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Distant Hills / Dog Park Trees
      if (gameState === 'PLAYING' || gameState === 'START') {
        bgOffsetRef.current += gameState === 'PLAYING' ? 0.6 * speedMultiplier : 0.3;
      }

      ctx.fillStyle = skyTheme.hillColor; // Dynamic hill color
      const hillOffset = bgOffsetRef.current * 0.3 % width;
      ctx.beginPath();
      ctx.ellipse(width * 0.3 - hillOffset, height - 55, 200, 90, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 0.8 - hillOffset, height - 55, 260, 110, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 1.3 - hillOffset, height - 55, 220, 95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Realistic Multi-Layered Volumetric Clouds with Parallax Depth
      const cloudColors = {
        top: skyTheme.cloudColor,
        base: skyTheme.label.includes('Night') ? 'rgba(30, 41, 59, 0.7)' : skyTheme.label.includes('Sunset') ? 'rgba(194, 65, 12, 0.5)' : 'rgba(186, 230, 253, 0.65)',
      };

      // Helper to calculate smooth, seamlessly wrapping parallax X positions
      const getParallaxX = (baseRatio: number, speedFactor: number) => {
        const wrapWidth = width + 240;
        const rawX = width * baseRatio - bgOffsetRef.current * speedFactor;
        return ((rawX % wrapWidth) + wrapWidth) % wrapWidth - 120;
      };

      // --- CLOUD LAYER 1: Deep Background Clouds (Slower Movement: 0.15x) ---
      ctx.save();
      ctx.fillStyle = cloudColors.top;
      ctx.globalAlpha = 0.5;
      [
        { ratio: 0.1, y: 50, scale: 0.8 },
        { ratio: 0.45, y: 65, scale: 0.75 },
        { ratio: 0.8, y: 45, scale: 0.85 },
      ].forEach((c) => {
        const cx = getParallaxX(c.ratio, 0.15);
        ctx.beginPath();
        ctx.arc(cx, c.y, 14 * c.scale, 0, Math.PI * 2);
        ctx.arc(cx + 12 * c.scale, c.y - 6 * c.scale, 18 * c.scale, 0, Math.PI * 2);
        ctx.arc(cx + 26 * c.scale, c.y, 13 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // --- CLOUD LAYER 2: Midground Clouds (Medium Movement: 0.40x) ---
      [
        { ratio: 0.25, y: 90 },
        { ratio: 0.75, y: 115 },
      ].forEach((c) => {
        const cx = getParallaxX(c.ratio, 0.40);
        ctx.save();
        ctx.globalAlpha = 0.75;
        // Base shadow
        ctx.fillStyle = cloudColors.base;
        ctx.beginPath();
        ctx.ellipse(cx + 25, c.y + 12, 45, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fluffy volumetric arcs
        ctx.fillStyle = cloudColors.top;
        ctx.beginPath();
        ctx.arc(cx, c.y, 22, 0, Math.PI * 2);
        ctx.arc(cx + 18, c.y - 12, 28, 0, Math.PI * 2);
        ctx.arc(cx + 42, c.y - 4, 24, 0, Math.PI * 2);
        ctx.arc(cx + 60, c.y + 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // --- CLOUD LAYER 3: Foreground Clouds (Faster Movement: 0.85x) ---
      [
        { ratio: 0.05, y: 135 },
        { ratio: 0.55, y: 100 },
      ].forEach((c) => {
        const cx = getParallaxX(c.ratio, 0.85);
        ctx.save();
        // Base shadow
        ctx.fillStyle = cloudColors.base;
        ctx.beginPath();
        ctx.ellipse(cx + 35, c.y + 16, 55, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main puffy body
        ctx.fillStyle = cloudColors.top;
        ctx.beginPath();
        ctx.arc(cx, c.y, 26, 0, Math.PI * 2);
        ctx.arc(cx + 24, c.y - 16, 34, 0, Math.PI * 2);
        ctx.arc(cx + 52, c.y - 6, 28, 0, Math.PI * 2);
        ctx.arc(cx + 75, c.y + 4, 22, 0, Math.PI * 2);
        ctx.fill();

        // Top highlight rim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(cx + 24, c.y - 18, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // --- 2. GAME LOGIC & PHYSICS (When Playing) ---
      if (gameState === 'PLAYING') {
        const dog = dogRef.current;
        const { speed: baseSpeed } = getSpeedAndGap(scoreRef.current);
        const scrollSpeed = dog.boostActive ? baseSpeed * 1.35 : baseSpeed;

        if (invulnerableTimeRef.current > 0) {
          invulnerableTimeRef.current -= dt;
        }

        // Crisp gravity for natural, controlled flap height
        const gravity = 1200 * selectedBreed.gravityScale;
        dog.velocity += gravity * dt;
        dog.y += dog.velocity * dt;

        // Smooth Ear Flapping Spring Physics
        dog.earFlapVelocity += (0.1 - dog.earAngle) * 12 * dt; // Spring back to neutral
        dog.earAngle += dog.earFlapVelocity;
        dog.earFlapVelocity *= 0.92; // Damping

        // Flappy Bird Rotation Dynamics (-25° on jump up, snappy nose dive down to +90°)
        const upAngle = -25 * (Math.PI / 180); // -25° (-0.436 rad)
        const maxDownAngle = 90 * (Math.PI / 180); // +90° (+1.57 rad)
        if (dog.velocity < 0) {
          dog.rotation = upAngle;
        } else {
          dog.rotation = Math.min(maxDownAngle, dog.rotation + 4.5 * dt);
        }

        // Power-up Timers
        if (dog.shieldActive) {
          dog.shieldTimeLeft -= dt;
          if (dog.shieldTimeLeft <= 0) dog.shieldActive = false;
        }
        if (dog.magnetActive) {
          dog.magnetTimeLeft -= dt;
          if (dog.magnetTimeLeft <= 0) dog.magnetActive = false;
        }
        if (dog.boostActive) {
          dog.boostTimeLeft -= dt;
          if (dog.boostTimeLeft <= 0) dog.boostActive = false;
        }

        // Check 1000 Pillars Victory Condition -> Spawn Dog House!
        const TARGET_PILLARS = 1000;
        if (scoreRef.current >= TARGET_PILLARS || dogHouseRef.current !== null) {
          if (!dogHouseRef.current) {
            dogHouseRef.current = {
              x: width + 120,
              y: groundY - 140,
              width: 150,
              height: 140,
              arrived: false,
              celebrated: false,
            };
          }

          const dh = dogHouseRef.current;
          if (dh.x > width * 0.52) {
            dh.x -= scrollSpeed;
          } else {
            dh.arrived = true;

            // Auto-guide dog into the cozy Dog House doorway!
            const doorTargetX = dh.x + 50;
            const doorTargetY = dh.y + 80;

            dog.x += (doorTargetX - dog.x) * 0.08;
            dog.y += (doorTargetY - dog.y) * 0.08;
            dog.velocity = 0;
            dog.rotation = 0;

            if (!dh.celebrated && Math.hypot(doorTargetX - dog.x, doorTargetY - dog.y) < 30) {
              dh.celebrated = true;
              soundManager.playPowerUpSound();
              soundManager.playBarkSound();
              onPowerupCollected('🏡 WELCOME HOME TO THE DOG HOUSE!');

              // Grand fireworks & heart burst particles!
              for (let p = 0; p < 70; p++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 4 + Math.random() * 10;
                particlesRef.current.push({
                  x: dog.x,
                  y: dog.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd - 2,
                  size: 5 + Math.random() * 7,
                  color: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'][p % 6],
                  alpha: 1,
                  maxLife: 60,
                  life: 60,
                  shape: 'star',
                });
              }

              if (onVictory) {
                setTimeout(() => {
                  onVictory(scoreRef.current, bonesRef.current);
                }, 1200);
              }
            }
          }
        } else {
          // Move & Spawn Obstacles
          nextObstacleDistanceRef.current -= scrollSpeed;
          if (nextObstacleDistanceRef.current <= 0) {
            spawnObstacle(width, height);
            nextObstacleDistanceRef.current = 240 + Math.random() * 60;
          }
        }

        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= scrollSpeed;

          // Check if dog passed obstacle
          if (!obs.passed && obs.x + obs.width < dog.x) {
            obs.passed = true;
            onScoreIncrement();
            soundManager.playBarkSound();
          }

          // Remove offscreen
          if (obs.x < -100) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        // Move Collectibles & Magnet Attraction
        for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
          const c = collectiblesRef.current[i];
          c.x -= scrollSpeed;
          c.pulsePhase += dt * 4;

          // Magnet Effect: pull bones towards dog
          if ((dog.magnetActive || isGodMode) && !c.collected && (c.type === 'bone' || c.type === 'golden_bone')) {
            const dx = dog.x - c.x;
            const dy = dog.y - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 320) {
              c.x += (dx / dist) * 10;
              c.y += (dy / dist) * 10;
            }
          }

          // Check Collectible Pickup (adapted for smaller dog)
          const distToDog = Math.hypot(dog.x - c.x, dog.y - c.y);
          if (!c.collected && distToDog < 32) {
            c.collected = true;

            // Spawn pickup sparkle particles
            for (let p = 0; p < 8; p++) {
              particlesRef.current.push({
                x: c.x,
                y: c.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 3 + Math.random() * 4,
                color: c.type === 'golden_bone' ? '#F59E0B' : '#60A5FA',
                alpha: 1,
                maxLife: 25,
                life: 25,
                shape: 'star',
              });
            }

            if (c.type === 'bone') {
              soundManager.playBoneSound(false);
              onBoneCollected(false);
            } else if (c.type === 'golden_bone') {
              soundManager.playBoneSound(true);
              onBoneCollected(true);
            } else if (c.type === 'shield') {
              soundManager.playPowerUpSound();
              dog.shieldActive = true;
              dog.shieldTimeLeft = 8; // 8 seconds shield
              onPowerupCollected('Tennis Ball Shield');
            } else if (c.type === 'magnet') {
              soundManager.playPowerUpSound();
              dog.magnetActive = true;
              dog.magnetTimeLeft = 10; // 10 seconds magnet
              onPowerupCollected('Steak Magnet');
            } else if (c.type === 'sausage_boost') {
              soundManager.playPowerUpSound();
              dog.boostActive = true;
              dog.boostTimeLeft = 5; // 5 seconds rainbow sausage speed!
              onPowerupCollected('Sausage Rocket Boost');
            }
          }

          if (c.x < -50 || c.collected) {
            collectiblesRef.current.splice(i, 1);
          }
        }

        // Ground & Ceiling Collisions
        if (dog.y > groundY - 12) {
          if (isGodMode) {
            dog.y = groundY - 18;
            dog.velocity = -6;
          } else if (invulnerableTimeRef.current <= 0) {
            if (dog.lives > 0) {
              dog.lives -= 1;
              if (onLivesChange) onLivesChange(dog.lives);
              invulnerableTimeRef.current = 1.2;
              dog.velocity = -7; // bounce up
              shakeIntensityRef.current = 14; // Screen shake on ground hit
              soundManager.playShieldBreakSound();
              onPowerupCollected(`💖 LIFE USED! ${dog.lives} LEFT`);
            } else {
              dog.y = groundY - 12;
              shakeIntensityRef.current = 24; // Heavy screen shake on crash
              soundManager.playCrashSound();
              onGameOver(scoreRef.current, bonesRef.current);
            }
          }
        } else if (dog.y < 16) {
          dog.y = 16;
          dog.velocity = 0;
        }

        // Obstacle Collisions (Accurate hitbox matching visual Flappy Bird pipe width & height)
        if (!dog.boostActive && !isGodMode && invulnerableTimeRef.current <= 0) {
          for (const obs of obstaclesRef.current) {
            const dogRadius = 12; // Accurate hitbox radius matching dog sprite
            const pipeLeft = obs.x - 2; // Pipe & cap visual left edge
            const pipeRight = obs.x + obs.width + 2; // Pipe & cap visual right edge
            const inXRange = dog.x + dogRadius > pipeLeft && dog.x - dogRadius < pipeRight;

            if (inXRange) {
              const inTopObstacle = dog.y - dogRadius < obs.topHeight - 2;
              const inBottomObstacle = dog.y + dogRadius > height - obs.bottomHeight - 60 + 2;

              if (inTopObstacle || inBottomObstacle) {
                if (dog.shieldActive) {
                  // Shield absorbs collision!
                  shakeIntensityRef.current = 12; // Screen shake on shield hit
                  soundManager.playShieldBreakSound();
                  dog.shieldActive = false;
                  dog.shieldTimeLeft = 0;

                  // Remove obstacle
                  obs.passed = true;
                  obs.x = -200;

                  // Burst shield particles
                  for (let p = 0; p < 15; p++) {
                    particlesRef.current.push({
                      x: dog.x,
                      y: dog.y,
                      vx: (Math.random() - 0.5) * 8,
                      vy: (Math.random() - 0.5) * 8,
                      size: 4 + Math.random() * 5,
                      color: '#3B82F6',
                      alpha: 1,
                      maxLife: 30,
                      life: 30,
                      shape: 'circle',
                    });
                  }
                } else if (dog.lives > 0) {
                  // Use Extra Life!
                  dog.lives -= 1;
                  if (onLivesChange) onLivesChange(dog.lives);
                  invulnerableTimeRef.current = 1.5;
                  obs.passed = true;
                  obs.x = -200;
                  shakeIntensityRef.current = 16; // Screen shake on extra life hit
                  soundManager.playShieldBreakSound();
                  onPowerupCollected(`💖 EXTRA LIFE SAVED YOU! ${dog.lives} LEFT`);

                  // Burst heart particles
                  for (let p = 0; p < 15; p++) {
                    particlesRef.current.push({
                      x: dog.x,
                      y: dog.y,
                      vx: (Math.random() - 0.5) * 8,
                      vy: (Math.random() - 0.5) * 8,
                      size: 4 + Math.random() * 5,
                      color: '#EC4899',
                      alpha: 1,
                      maxLife: 30,
                      life: 30,
                      shape: 'circle',
                    });
                  }
                } else {
                  // Crash / Caught by Leash!
                  shakeIntensityRef.current = 28; // Dramatic impact screen shake on game over
                  soundManager.playCrashSound();
                  onPowerupCollected('🐕 CAUGHT BY THE LEASH! ⛓️');

                  // Spawn "Caught by Leash" chain & leash loop particle burst!
                  for (let p = 0; p < 30; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 3 + Math.random() * 8;
                    particlesRef.current.push({
                      x: dog.x,
                      y: dog.y,
                      vx: Math.cos(angle) * spd,
                      vy: Math.sin(angle) * spd,
                      size: 4 + Math.random() * 6,
                      color: p % 3 === 0 ? '#EF4444' : p % 3 === 1 ? '#3B82F6' : '#F59E0B',
                      alpha: 1,
                      maxLife: 35,
                      life: 35,
                      shape: p % 2 === 0 ? 'star' : 'feather',
                    });
                  }

                  onGameOver(scoreRef.current, bonesRef.current);
                  break;
                }
              }
            }
          }
        }
      }

      // --- 3. DRAW OBSTACLES (AUTHENTIC FLAPPY BIRD PIPES) ---
      for (const obs of obstaclesRef.current) {
        ctx.save();

        // Pipe / Leash theme palette
        let baseColor = '#73BF2E'; // Classic Flappy Green
        let highlightColor = '#A3E85C';
        let shadowColor = '#4F9B17';
        let darkShadowColor = '#2C6409';
        let strokeColor = '#142806';
        let collarColor = '#DC2626'; // Dog collar crimson accent on cap
        let buckleColor = '#F59E0B'; // Gold buckle / bone badge

        if (obs.type === 'blue_leash') {
          baseColor = '#2563EB';
          highlightColor = '#93C5FD';
          shadowColor = '#1D4ED8';
          darkShadowColor = '#1E3A8A';
          strokeColor = '#0F172A';
          collarColor = '#0284C7';
          buckleColor = '#E2E8F0';
        } else if (obs.type === 'leather_leash') {
          baseColor = '#854D0E';
          highlightColor = '#FDE047';
          shadowColor = '#653B0A';
          darkShadowColor = '#452606';
          strokeColor = '#1F1102';
          collarColor = '#B45309';
          buckleColor = '#F59E0B';
        } else if (obs.type === 'neon_leash') {
          baseColor = '#EA580C';
          highlightColor = '#FED7AA';
          shadowColor = '#C2410C';
          darkShadowColor = '#7C2D12';
          strokeColor = '#3A1507';
          collarColor = '#EF4444';
          buckleColor = '#FEF08A';
        }

        const pipeX = obs.x;
        const pipeW = obs.width; // 64
        const capHeight = 28;
        const capOverhang = 6;
        const capX = pipeX - capOverhang;
        const capW = pipeW + capOverhang * 2; // 76

        // Helper to draw a Flappy Bird Pipe (stem + cap) with 3D gradient shading & collar details
        const drawFlappyPipe = (
          stemX: number,
          stemY: number,
          stemW: number,
          stemH: number,
          cX: number,
          cY: number,
          cW: number,
          cH: number,
          isTop: boolean
        ) => {
          if (stemH <= 0 && cH <= 0) return;

          // 1. STEM FILL & 3D GRADIENT SHADING
          if (stemH > 0) {
            ctx.fillStyle = baseColor;
            ctx.fillRect(stemX, stemY, stemW, stemH);

            // Left edge dark shadow
            ctx.fillStyle = darkShadowColor;
            ctx.fillRect(stemX, stemY, 5, stemH);
            ctx.fillStyle = shadowColor;
            ctx.fillRect(stemX + 5, stemY, 6, stemH);

            // Vertical specular highlight bar (Classic Flappy Bird 3D sheen)
            ctx.fillStyle = highlightColor;
            ctx.fillRect(stemX + 13, stemY, 8, stemH);

            // Right edge shadow bar
            ctx.fillStyle = shadowColor;
            ctx.fillRect(stemX + stemW - 8, stemY, 8, stemH);
          }

          // 2. PIPE CAP / FLANGE (Wider Rim at gap entrance)
          ctx.fillStyle = baseColor;
          ctx.fillRect(cX, cY, cW, cH);

          // Cap Left Shadow
          ctx.fillStyle = darkShadowColor;
          ctx.fillRect(cX, cY, 6, cH);
          ctx.fillStyle = shadowColor;
          ctx.fillRect(cX + 6, cY, 7, cH);

          // Cap Specular Highlight
          ctx.fillStyle = highlightColor;
          ctx.fillRect(cX + 15, cY, 9, cH);

          // Cap Right Shadow
          ctx.fillStyle = shadowColor;
          ctx.fillRect(cX + cW - 9, cY, 9, cH);

          // 3. DOG COLLAR ACCENT STRAP & BUCKLE ON CAP
          const collarY = cY + (cH - 12) / 2;
          ctx.fillStyle = collarColor;
          ctx.fillRect(cX + 2, collarY, cW - 4, 12);

          // Collar stitching lines
          ctx.strokeStyle = buckleColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(cX + 4, collarY + 2);
          ctx.lineTo(cX + cW - 4, collarY + 2);
          ctx.moveTo(cX + 4, collarY + 10);
          ctx.lineTo(cX + cW - 4, collarY + 10);
          ctx.stroke();
          ctx.setLineDash([]);

          // Center Metal Buckle & Dog Bone Badge
          const buckleX = cX + cW / 2 - 8;
          ctx.fillStyle = buckleColor;
          ctx.fillRect(buckleX, collarY - 1, 16, 14);
          ctx.fillStyle = strokeColor;
          ctx.fillRect(buckleX + 3, collarY + 2, 10, 8);
          ctx.fillStyle = buckleColor;
          ctx.fillRect(buckleX + 5, collarY + 4, 6, 4);

          // 4. CRISP DARK OUTLINES & RIM DROP SHADOW
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;

          // Stem outline
          if (stemH > 0) {
            ctx.strokeRect(stemX, stemY, stemW, stemH);
          }

          // Cap outline
          ctx.strokeRect(cX, cY, cW, cH);

          // Under-cap overhang drop shadow onto stem / gap
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          if (isTop) {
            ctx.fillRect(stemX, cY + cH, stemW, 5);
          } else {
            ctx.fillRect(stemX, cY - 5, stemW, 5);
          }
        };

        // --- TOP PIPE (Hanging down from sky) ---
        const topStemH = Math.max(0, obs.topHeight - capHeight);
        drawFlappyPipe(
          pipeX,
          0,
          pipeW,
          topStemH,
          capX,
          topStemH,
          capW,
          capHeight,
          true
        );

        // --- BOTTOM PIPE (Rising up from ground) ---
        const bottomY = height - obs.bottomHeight - 60;
        const bottomStemY = bottomY + capHeight;
        const bottomStemH = Math.max(0, obs.bottomHeight - capHeight);
        drawFlappyPipe(
          pipeX,
          bottomStemY,
          pipeW,
          bottomStemH,
          capX,
          bottomY,
          capW,
          capHeight,
          false
        );

        ctx.restore();
      }

      // --- 3.5 DRAW DOG HOUSE (When arrived at 1000 Pillars) ---
      if (dogHouseRef.current) {
        const dh = dogHouseRef.current;
        ctx.save();
        ctx.translate(dh.x, dh.y);

        // 1. Chimney with heart smoke
        ctx.fillStyle = '#78350F';
        ctx.fillRect(dh.width - 40, -25, 18, 30);
        ctx.fillStyle = '#451A03';
        ctx.fillRect(dh.width - 43, -28, 24, 6);

        // Heart smoke puff
        ctx.fillStyle = 'rgba(244, 114, 182, 0.85)';
        ctx.font = '14px sans-serif';
        ctx.fillText('❤️', dh.width - 32, -35 + Math.sin(now * 0.005) * 4);

        // 2. Main Wooden House Walls
        ctx.fillStyle = '#92400E'; // Cedar wood body
        ctx.fillRect(0, 30, dh.width, dh.height - 30);

        // Timber horizontal plank texture lines
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        for (let py = 45; py < dh.height; py += 15) {
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(dh.width, py);
          ctx.stroke();
        }

        // 3. Triangular Roof
        ctx.fillStyle = '#B91C1C'; // Terracotta Red Roof
        ctx.beginPath();
        ctx.moveTo(-15, 32);
        ctx.lineTo(dh.width / 2, -15);
        ctx.lineTo(dh.width + 15, 32);
        ctx.closePath();
        ctx.fill();

        // Roof Trim & Overhang
        ctx.strokeStyle = '#F59E0B'; // Golden Roof Trim
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-18, 33);
        ctx.lineTo(dh.width / 2, -17);
        ctx.lineTo(dh.width + 18, 33);
        ctx.stroke();

        // Golden Bone Ornament on Peak
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(dh.width / 2, -18, 9, 0, Math.PI * 2);
        ctx.fill();

        // 4. Cozy Arched Doorway Entrance
        const doorW = 54;
        const doorH = 68;
        const doorX = (dh.width - doorW) / 2;
        const doorY = dh.height - doorH;

        // Dark doorway interior with warm glowing hearth
        ctx.fillStyle = '#1E1B4B'; // Cozy dark room
        ctx.beginPath();
        ctx.arc(doorX + doorW / 2, doorY + doorW / 2, doorW / 2, Math.PI, 0);
        ctx.rect(doorX, doorY + doorW / 2, doorW, doorH - doorW / 2);
        ctx.fill();

        // Soft warm glow from inside
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.beginPath();
        ctx.arc(doorX + doorW / 2, doorY + doorW / 2, doorW / 2 - 2, Math.PI, 0);
        ctx.fill();

        // 5. Wooden Nameplate "DOGGY HAVEN 🏡"
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(dh.width / 2 - 45, 10, 90, 18);
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2;
        ctx.strokeRect(dh.width / 2 - 45, 10, 90, 18);

        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DOGGY HAVEN 🏡', dh.width / 2, 19);

        // 6. Front Lawn Welcome Mat & Food Bowl
        // Welcome Mat
        ctx.fillStyle = '#15803D';
        ctx.fillRect(doorX - 10, dh.height - 4, doorW + 20, 10);
        ctx.fillStyle = '#FEF08A';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('WELCOME', dh.width / 2, dh.height + 1);

        // Shiny Red Food Bowl with Bone
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.ellipse(dh.width - 20, dh.height + 2, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF3C7';
        ctx.font = '10px sans-serif';
        ctx.fillText('🦴', dh.width - 20, dh.height - 2);

        // 7. Festive Banner Above House
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(dh.width / 2 - 65, -55, 130, 22);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.strokeRect(dh.width / 2 - 65, -55, 130, 22);
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('👑 1000 PILLARS HOME!', dh.width / 2, -44);

        ctx.restore();
      }
      for (const c of collectiblesRef.current) {
        if (c.collected) continue;
        ctx.save();
        ctx.translate(c.x, c.y + Math.sin(c.pulsePhase) * 4);

        if (c.type === 'bone') {
          // White Bone
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#D1D5DB';
          ctx.lineWidth = 2;

          // Central bar
          ctx.fillRect(-12, -3, 24, 6);
          // End knobs
          ctx.beginPath();
          ctx.arc(-12, -4, 5, 0, Math.PI * 2);
          ctx.arc(-12, 4, 5, 0, Math.PI * 2);
          ctx.arc(12, -4, 5, 0, Math.PI * 2);
          ctx.arc(12, 4, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

        } else if (c.type === 'golden_bone') {
          // Golden Bone with Fast Vector Glow
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(-14, -4, 28, 8);
          ctx.beginPath();
          ctx.arc(-14, -5, 6, 0, Math.PI * 2);
          ctx.arc(-14, 5, 6, 0, Math.PI * 2);
          ctx.arc(14, -5, 6, 0, Math.PI * 2);
          ctx.arc(14, 5, 6, 0, Math.PI * 2);
          ctx.fill();

        } else if (c.type === 'shield') {
          // Tennis Ball Shield Icon
          ctx.fillStyle = '#84CC16'; // Neon green tennis ball
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0.4, 2.2);
          ctx.stroke();

        } else if (c.type === 'magnet') {
          // Steak / Magnet
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🥩', 0, 1);

        } else if (c.type === 'sausage_boost') {
          // Sausage Boost
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 8, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🌭', 0, 1);
        }

        ctx.restore();
      }

      // --- 5. DRAW DOG WITH GIANT FLAPPING EARS ---
      const dog = dogRef.current;
      ctx.save();
      ctx.translate(dog.x, dog.y);
      ctx.rotate(dog.rotation);
      ctx.scale(0.42, 0.42); // Cute small dog size

      // Rainbow Boost Trail behind dog
      if (dog.boostActive) {
        ctx.save();
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
        colors.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(-25 - idx * 8, Math.sin(now * 0.02 + idx) * 4, 12 - idx * 2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Tennis Ball Shield Bubble
      if (dog.shieldActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Magnet Aura Glow
      if (dog.magnetActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // A) BACK EAR (Cute & compact)
      ctx.save();
      ctx.translate(-4, -8);
      ctx.rotate(-0.2 + dog.earAngle * 0.7);

      ctx.fillStyle = selectedBreed.earColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-12, -22, -26, -10, -20, 12);
      ctx.bezierCurveTo(-14, 20, -4, 12, 0, 0);
      ctx.fill();
      ctx.restore();

      // B) DOG BODY & LEGS & TAIL
      // Tail (wagging!)
      ctx.save();
      ctx.translate(-22, -2);
      ctx.rotate(Math.sin(now * 0.015) * 0.4);
      ctx.fillStyle = selectedBreed.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Main Torso / Body
      ctx.fillStyle = selectedBreed.bodyColor;
      ctx.beginPath();
      ctx.ellipse(-6, 2, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Belly patch
      ctx.fillStyle = selectedBreed.bellyColor;
      ctx.beginPath();
      ctx.ellipse(-4, 6, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Paws (flying position)
      ctx.fillStyle = selectedBreed.bodyColor;
      ctx.beginPath();
      ctx.arc(-14, 12, 5, 0, Math.PI * 2); // back paw
      ctx.arc(6, 12, 5, 0, Math.PI * 2); // front paw
      ctx.fill();

      // Collar
      ctx.fillStyle = '#EF4444'; // Red collar
      ctx.fillRect(4, -4, 5, 14);
      ctx.fillStyle = '#F59E0B'; // Gold collar tag
      ctx.beginPath();
      ctx.arc(6, 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // C) DOG HEAD & SNOUT
      ctx.fillStyle = selectedBreed.bodyColor;
      ctx.beginPath();
      ctx.arc(10, -6, 15, 0, Math.PI * 2);
      ctx.fill();

      // Snout
      ctx.beginPath();
      ctx.ellipse(18, -2, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black Nose
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(25, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(13, -10, 5, 0, Math.PI * 2);
      ctx.fill();

      if (gameState === 'GAMEOVER') {
        // Dizzy X Eye
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(11, -12);
        ctx.lineTo(15, -8);
        ctx.moveTo(15, -12);
        ctx.lineTo(11, -8);
        ctx.stroke();
      } else {
        // Cute Pupil with shine
        ctx.fillStyle = selectedBreed.eyeColor;
        ctx.beginPath();
        ctx.arc(14, -10, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(15, -11, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Happy Tongue Out
      ctx.fillStyle = '#F43F5E'; // Pink tongue
      ctx.beginPath();
      ctx.ellipse(20, 2, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // D) FRONT CUTE FLAPPING EAR
      // Subtle ear-flap motion trail ghosts when jumping
      if (dog.velocity < -50) {
        ctx.save();
        [1, 2].forEach((ghostStep) => {
          ctx.save();
          ctx.globalAlpha = 0.35 / ghostStep;
          ctx.translate(2 - ghostStep * 6, -10 + ghostStep * 2);
          ctx.rotate(dog.earAngle + ghostStep * 0.12);
          ctx.fillStyle = selectedBreed.earColor;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-14, -22, -28, -10, -22, 14);
          ctx.bezierCurveTo(-14, 22, -4, 12, 0, 0);
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      }

      ctx.save();
      ctx.translate(2, -10);
      ctx.rotate(dog.earAngle);

      // Outer Ear Color
      ctx.fillStyle = selectedBreed.earColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-14, -22, -28, -10, -22, 14);
      ctx.bezierCurveTo(-14, 22, -4, 12, 0, 0);
      ctx.fill();

      // Inner Ear Velvet/Pink Pad Highlight
      ctx.fillStyle = selectedBreed.earInnerColor;
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.bezierCurveTo(-10, -14, -20, -6, -15, 8);
      ctx.bezierCurveTo(-10, 14, -4, 8, -2, -4);
      ctx.fill();

      ctx.restore();

      // E) DRAW ACCESSORIES ON HEAD
      if (selectedAccessory.id === 'goggles') {
        // Aviator Goggles
        ctx.save();
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(4, -14, 18, 4); // Strap
        ctx.fillStyle = '#D97706'; // Gold frame
        ctx.beginPath();
        ctx.arc(13, -12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#60A5FA'; // Glass lens
        ctx.beginPath();
        ctx.arc(13, -12, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (selectedAccessory.id === 'bow') {
        // Red Bow
        ctx.save();
        ctx.fillStyle = '#EF4444';
        ctx.translate(6, -18);
        ctx.beginPath();
        ctx.arc(-5, 0, 5, 0, Math.PI * 2);
        ctx.arc(5, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (selectedAccessory.id === 'party_hat') {
        // Party Cone Hat
        ctx.save();
        ctx.translate(8, -18);
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, -16);
        ctx.closePath();
        ctx.fill();
        // Yellow Pom-Pom
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, -17, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (selectedAccessory.id === 'crown') {
        // Royal Crown
        ctx.save();
        ctx.translate(6, -20);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(-7, -8);
        ctx.lineTo(-3, -4);
        ctx.lineTo(0, -10);
        ctx.lineTo(3, -4);
        ctx.lineTo(7, -8);
        ctx.lineTo(7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // Restore Dog transform

      // --- 6. DRAW PARTICLES ---
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.alpha = Math.max(0, p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'ear_trail') {
          // Dynamic ear-flap swoosh crescent
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 1.6, p.size * 0.8, -0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'feather') {
          // Soft ear velvet tuft particle
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'wind_line') {
          // Sleek wind speed streak
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.size * 5, p.y + p.vy * 2);
          ctx.stroke();
        } else if (p.shape === 'star') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // --- 7. DRAW GROUND ---
      if (gameState === 'PLAYING' || gameState === 'START') {
        groundOffsetRef.current = (groundOffsetRef.current + (gameState === 'PLAYING' ? 3 * speedMultiplier : 1)) % 40;
      }

      // Ground Dirt Base
      ctx.fillStyle = '#D97706';
      ctx.fillRect(0, groundY, width, 60);

      // Top Grass Band
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(0, groundY, width, 14);

      // Moving Grass Stripes
      ctx.fillStyle = '#16A34A';
      for (let x = -groundOffsetRef.current; x < width + 40; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 12, groundY);
        ctx.lineTo(x + 6, groundY + 14);
        ctx.fill();
      }

      ctx.restore();

      // Loop frame
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [gameState, selectedBreed, selectedAccessory]);

  // Canvas Resizing handler with High-DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      className="relative w-full h-full select-none cursor-pointer overflow-hidden touch-none"
      onClick={handleFlap}
      id="game-canvas-container"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        id="flappy-dog-canvas"
      />
    </div>
  );
};
