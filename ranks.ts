export interface DogRank {
  scoreRequirement: number;
  title: string;
  badge: string;
  description: string;
  color: string;
}

export const DOG_RANKS: DogRank[] = [
  { scoreRequirement: 0, title: 'Beginner Pup', badge: '🐶', description: 'Taking first flight with giant ears!', color: 'text-amber-300' },
  { scoreRequirement: 100, title: 'Good Flapper', badge: '🐾', description: 'Mastering smooth ear flaps!', color: 'text-emerald-400' },
  { scoreRequirement: 200, title: 'Better Flapper', badge: '🪽', description: 'Soaring past obstacles with ease!', color: 'text-cyan-400' },
  { scoreRequirement: 300, title: 'Best Flying Dog', badge: '🌟', description: 'A true sky legend among pups!', color: 'text-yellow-400' },
  { scoreRequirement: 400, title: 'Pro Aviator Dog', badge: '🥽', description: '3 LIVES UNLOCKED! High-speed night flight!', color: 'text-indigo-400' },
  { scoreRequirement: 500, title: 'Master Ear Glider', badge: '⚡', description: 'Graceful glides through tight pillars!', color: 'text-purple-400' },
  { scoreRequirement: 600, title: 'Legendary Sky Hound', badge: '🔥', description: 'Unstoppable aerial speed & reflexes!', color: 'text-orange-500' },
  { scoreRequirement: 700, title: 'Celestial Winged Dog', badge: '☀️', description: 'Daylight breaks again for the sky master!', color: 'text-amber-400' },
  { scoreRequirement: 800, title: 'Supreme Flying Pup', badge: '👑', description: 'Nearing the legendary 1000 bone peak!', color: 'text-rose-400' },
  { scoreRequirement: 900, title: 'Mythic Ear Monarch', badge: '🌌', description: 'One step away from divine canine glory!', color: 'text-fuchsia-400' },
  { scoreRequirement: 1000, title: 'GOD EMPEROR DOG', badge: '👑🐶⚡', description: 'REACHED THE FINAL STAGE! Supreme Ruler of the Sky!', color: 'text-yellow-300 font-black animate-pulse' },
];

export function getDogRank(score: number): DogRank {
  for (let i = DOG_RANKS.length - 1; i >= 0; i--) {
    if (score >= DOG_RANKS[i].scoreRequirement) {
      return DOG_RANKS[i];
    }
  }
  return DOG_RANKS[0];
}
