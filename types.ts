export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type DogBreedId = 'beagle' | 'basset' | 'spaniel' | 'dachshund' | 'golden';

export type AccessoryId = 'none' | 'goggles' | 'bow' | 'crown' | 'party_hat';

export interface DogBreed {
  id: DogBreedId;
  name: string;
  description: string;
  earType: 'floppy_long' | 'giant_droop' | 'wavy_silky' | 'perky_huge' | 'velvet_soft';
  bodyColor: string;
  earColor: string;
  earInnerColor: string;
  bellyColor: string;
  eyeColor: string;
  unlocked: boolean;
  cost: number; // in bones
  flapPower: number;
  gravityScale: number;
}

export interface Accessory {
  id: AccessoryId;
  name: string;
  icon: string;
  cost: number;
  unlocked: boolean;
}

export interface DogPosition {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  earAngle: number; // angle of ear flapping in radians
  earTargetAngle: number;
  earFlapVelocity: number;
  lives: number; // Lives count (gains 3 lives after crossing 400 pillars)
  shieldActive: boolean;
  shieldTimeLeft: number;
  magnetActive: boolean;
  magnetTimeLeft: number;
  boostActive: boolean;
  boostTimeLeft: number;
}

export type ObstacleType = 'red_leash' | 'blue_leash' | 'leather_leash' | 'neon_leash';

export interface Obstacle {
  x: number;
  width: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  passed: boolean;
  type: ObstacleType;
  colorTheme: {
    top: string;
    bottom: string;
    accent: string;
  };
}

export type CollectibleType = 'bone' | 'golden_bone' | 'shield' | 'magnet' | 'sausage_boost';

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: CollectibleType;
  collected: boolean;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  shape?: 'circle' | 'star' | 'heart' | 'feather' | 'bone' | 'ear_trail' | 'wind_line';
}

export interface GameStats {
  highScore: number;
  totalBones: number;
  gamesPlayed: number;
  totalFlaps: number;
  totalDistance: number;
  unlockedBreeds: DogBreedId[];
  unlockedAccessories: AccessoryId[];
  selectedBreed: DogBreedId;
  selectedAccessory: AccessoryId;
}
