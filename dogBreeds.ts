import { DogBreed, Accessory } from '../types';

export const INITIAL_DOG_BREEDS: DogBreed[] = [
  {
    id: 'beagle',
    name: 'Buddy the Beagle',
    description: 'Bouncy, loyal pup with iconic long floppy ears that lift him gracefully into the air.',
    earType: 'floppy_long',
    bodyColor: '#D97706', // warm tan
    earColor: '#78350F', // deep brown
    earInnerColor: '#FDE68A', // soft cream
    bellyColor: '#FEF3C7',
    eyeColor: '#1F2937',
    unlocked: true,
    cost: 0,
    flapPower: 7.8,
    gravityScale: 0.38,
  },
  {
    id: 'basset',
    name: 'Barnaby the Basset',
    description: 'Equipped with giant droopy ears that act like majestic glider wings.',
    earType: 'giant_droop',
    bodyColor: '#B45309', // rich rust
    earColor: '#451A03', // dark chocolate
    earInnerColor: '#FECACA', // soft pinkish cream
    bellyColor: '#FFFBEB',
    eyeColor: '#111827',
    unlocked: false,
    cost: 40,
    flapPower: 7.5,
    gravityScale: 0.35,
  },
  {
    id: 'spaniel',
    name: 'Daisy the Spaniel',
    description: 'Silky wavy curls flutter like butterflies with maximum aerial stability.',
    earType: 'wavy_silky',
    bodyColor: '#F59E0B', // golden amber
    earColor: '#92400E', // chestnut
    earInnerColor: '#FEF08A',
    bellyColor: '#FEFCE8',
    eyeColor: '#374151',
    unlocked: false,
    cost: 75,
    flapPower: 7.6,
    gravityScale: 0.36,
  },
  {
    id: 'dachshund',
    name: 'Otto the Dachshund',
    description: 'Aerodynamic sausage dog with swift high-velocity ear flapping mechanics.',
    earType: 'perky_huge',
    bodyColor: '#7C2D12', // mahogany
    earColor: '#451A03',
    earInnerColor: '#FDBA74',
    bellyColor: '#FFEDD5',
    eyeColor: '#1F2937',
    unlocked: false,
    cost: 120,
    flapPower: 8.0,
    gravityScale: 0.39,
  },
  {
    id: 'golden',
    name: 'Cooper the Golden',
    description: 'Fluffy puppy with velvety huge ears and maximum floaty jump glide.',
    earType: 'velvet_soft',
    bodyColor: '#FBBF24', // golden yellow
    earColor: '#D97706',
    earInnerColor: '#FEF3C7',
    bellyColor: '#FFFFFF',
    eyeColor: '#1F2937',
    unlocked: false,
    cost: 180,
    flapPower: 7.6,
    gravityScale: 0.34,
  }
];

export const INITIAL_ACCESSORIES: Accessory[] = [
  {
    id: 'none',
    name: 'Natural Look',
    icon: '🐕',
    cost: 0,
    unlocked: true,
  },
  {
    id: 'goggles',
    name: 'Aviator Goggles',
    icon: '🥽',
    cost: 25,
    unlocked: false,
  },
  {
    id: 'bow',
    name: 'Cute Red Bow',
    icon: '🎀',
    cost: 50,
    unlocked: false,
  },
  {
    id: 'party_hat',
    name: 'Party Cone Hat',
    icon: '🥳',
    cost: 85,
    unlocked: false,
  },
  {
    id: 'crown',
    name: 'Royal Crown',
    icon: '👑',
    cost: 150,
    unlocked: false,
  }
];
