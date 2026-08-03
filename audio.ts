// Web Audio API Sound Synthesizer for Flappy Dog Game

class SoundController {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private currentNoteIndex: number = 0;

  constructor() {
    // AudioContext will be lazy initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.musicGain) {
      this.musicGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft woosh / ear flap sound
  public playFlapSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Filtered noise + low sine sweep for airy ear woosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore audio errors
    }
  }

  // Cute pup bark / woof sound on start or big jump
  public playBarkSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  // Bone collection chime
  public playBoneSound(isGolden: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = isGolden ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];
      const duration = isGolden ? 0.08 : 0.06;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * duration);

        gain.gain.setValueAtTime(0.3, now + idx * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * duration + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * duration);
        osc.stop(now + idx * duration + 0.12);
      });
    } catch {
      // Ignore
    }
  }

  // Power-up pickup sound
  public playPowerUpSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }

  // Shield pop sound
  public playShieldBreakSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  // Crash / Whimper sound when game over
  public playCrashSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thud.type = 'sawtooth';
      thud.frequency.setValueAtTime(150, now);
      thud.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      thudGain.gain.setValueAtTime(0.5, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thud.start(now);
      thud.stop(now + 0.3);

      // Whimper slide after thud
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const wTime = this.ctx.currentTime;
        const whimper = this.ctx.createOscillator();
        const wGain = this.ctx.createGain();

        whimper.type = 'sine';
        whimper.frequency.setValueAtTime(500, wTime);
        whimper.frequency.exponentialRampToValueAtTime(300, wTime + 0.25);

        wGain.gain.setValueAtTime(0.2, wTime);
        wGain.gain.exponentialRampToValueAtTime(0.01, wTime + 0.25);

        whimper.connect(wGain);
        wGain.connect(this.ctx.destination);

        whimper.start(wTime);
        whimper.stop(wTime + 0.25);
      }, 150);
    } catch {
      // Ignore
    }
  }

  // Creative, Uplifting & Bouncy Chiptune Background Music
  public startBackgroundMusic() {
    if (this.isMusicPlaying || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.currentNoteIndex = 0;

    // Cheerful pentatonic & major melody sequence with bass harmony
    const melody = [
      523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 523.25, 587.33,
      659.25, 783.99, 880.00, 1046.50, 880.00, 783.99, 659.25, 587.33,
      523.25, 659.25, 783.99, 1174.66, 1046.50, 880.00, 783.99, 659.25,
      587.33, 659.25, 783.99, 880.00,  783.99, 659.25, 587.33, 523.25,
    ];

    const bassLine = [
      130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
      130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
      146.83, 146.83, 174.61, 174.61, 196.00, 196.00, 220.00, 220.00,
      130.81, 130.81, 164.81, 164.81, 196.00, 196.00, 261.63, 196.00,
    ];

    const noteDuration = 180; // Fast bouncy 180ms tempo

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || this.isMuted) return;

      try {
        const now = this.ctx.currentTime;
        const step = this.currentNoteIndex % melody.length;
        const mainFreq = melody[step];
        const bassFreq = bassLine[step];
        this.currentNoteIndex++;

        // 1. Lead Melody (Soft Warm Triangle Wave)
        const oscMelody = this.ctx.createOscillator();
        const gainMelody = this.ctx.createGain();
        oscMelody.type = 'triangle';
        oscMelody.frequency.setValueAtTime(mainFreq, now);

        // Subtle vibrato/bounce effect on every 4th beat
        if (step % 4 === 0) {
          oscMelody.frequency.exponentialRampToValueAtTime(mainFreq * 1.02, now + 0.08);
          oscMelody.frequency.exponentialRampToValueAtTime(mainFreq, now + 0.15);
        }

        gainMelody.gain.setValueAtTime(0.045, now);
        gainMelody.gain.exponentialRampToValueAtTime(0.004, now + 0.15);

        oscMelody.connect(gainMelody);
        gainMelody.connect(this.ctx.destination);
        oscMelody.start(now);
        oscMelody.stop(now + 0.15);

        // 2. Bouncy Bass Sub-Layer (Low Sine Warmth on alternating beats)
        if (step % 2 === 0) {
          const oscBass = this.ctx.createOscillator();
          const gainBass = this.ctx.createGain();
          oscBass.type = 'sine';
          oscBass.frequency.setValueAtTime(bassFreq, now);

          gainBass.gain.setValueAtTime(0.035, now);
          gainBass.gain.exponentialRampToValueAtTime(0.002, now + 0.16);

          oscBass.connect(gainBass);
          gainBass.connect(this.ctx.destination);
          oscBass.start(now);
          oscBass.stop(now + 0.16);
        }
      } catch {
        // Ignore audio context glitches
      }
    }, noteDuration);
  }

  public stopBackgroundMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundController();
