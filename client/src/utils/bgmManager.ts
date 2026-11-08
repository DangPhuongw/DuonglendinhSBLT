import { voiceReader } from './voiceReader';

// Olympia Gameplay BGM Manager: Plays the official Olympia question countdown audio
class BgmManager {
  private audioEl: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private enabled: boolean = true;
  private timerId: any = null;
  private isUrgent: boolean = false;
  private step: number = 0;
  private audioUnlocked: boolean = false;
  private isDucked: boolean = false;

  private masterGain: GainNode | null = null;
  private trackUrl: string = '/audio/question_bgm.mp3';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('olympia_bgm');
      this.enabled = saved !== null ? saved === 'true' : true;

      // Initialize HTML5 Audio Element for real MP3
      this.initAudioElement();

      // Listen to voice reader to duck audio volume when host speaks
      voiceReader.subscribe((speaking) => {
        this.setDucking(speaking);
      });

      // Browser autoplay policy: Unlock on first user interaction
      const unlock = () => {
        if (!this.audioUnlocked) {
          this.audioUnlocked = true;
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
          const el = this.audioEl;
          if (el) {
            // Prime audio buffer
            el.play().then(() => {
              if (!this.isPlaying) {
                el.pause();
                el.currentTime = 0;
              }
            }).catch(() => {});
          }
        }
      };

      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;
    try {
      this.audioEl = new Audio(this.trackUrl);
      this.audioEl.loop = true;
      this.audioEl.volume = 0.45;

      this.audioEl.addEventListener('error', () => {
        // Fallback to synthesized audio if MP3 fails
        if (this.isPlaying && this.enabled) {
          this.startSynthesizedTheme();
        }
      });
    } catch (e) {
      console.warn('Audio element initialization error:', e);
    }
  }

  private setDucking(ducking: boolean) {
    this.isDucked = ducking;
    if (this.audioEl) {
      this.audioEl.volume = ducking ? 0.18 : 0.45;
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(
          ducking ? 0.04 : 0.12,
          this.ctx.currentTime
        );
      } catch (e) {}
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public set isEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('olympia_bgm', val ? 'true' : 'false');
    }
    if (!val) {
      this.stop();
    } else {
      this.start();
    }
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public start() {
    if (!this.enabled) return;
    this.isPlaying = true;

    // Try playing real MP3 track first
    if (this.audioEl) {
      this.audioEl.volume = this.isDucked ? 0.18 : 0.45;
      this.audioEl.currentTime = 0;
      const playPromise = this.audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // MP3 playing successfully
          })
          .catch(() => {
            // Fallback if audio element blocked
            this.startSynthesizedTheme();
          });
        return;
      }
    }

    this.startSynthesizedTheme();
  }

  // Melodic fallback synthesizer
  private startSynthesizedTheme() {
    const ctx = this.getContext();
    if (!ctx) return;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    try {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isDucked ? 0.04 : 0.12, ctx.currentTime);
      this.masterGain.connect(ctx.destination);

      this.step = 0;
      this.scheduleNextNote();
      this.timerId = setInterval(() => {
        this.scheduleNextNote();
      }, this.isUrgent ? 160 : 250);
    } catch (e) {
      console.warn('Synthesizer error:', e);
    }
  }

  private scheduleNextNote() {
    if (!this.isPlaying || !this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    const melody = [
      220.0, 329.63, 440.0, 329.63, 261.63, 329.63, 440.0, 523.25,
      174.61, 261.63, 349.23, 261.63, 220.0, 261.63, 349.23, 440.0,
      261.63, 329.63, 392.0, 329.63, 261.63, 329.63, 392.0, 523.25,
      196.0, 293.66, 392.0, 293.66, 246.94, 293.66, 392.0, 493.88,
    ];

    const currentFreq = melody[this.step % melody.length];

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(currentFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.22);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.24);

      if (this.step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        kickGain.gain.setValueAtTime(0.2, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.14);
      }

      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(this.step % 2 === 0 ? 1200 : 900, now);
      hatGain.gain.setValueAtTime(0.015, now);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      hatOsc.connect(hatGain);
      hatGain.connect(this.masterGain);
      hatOsc.start(now);
      hatOsc.stop(now + 0.05);
    } catch (e) {}

    this.step++;
  }

  public setUrgency(urgent: boolean) {
    if (this.isUrgent !== urgent) {
      this.isUrgent = urgent;
      if (this.isPlaying && this.timerId) {
        clearInterval(this.timerId);
        this.timerId = setInterval(() => {
          this.scheduleNextNote();
        }, this.isUrgent ? 160 : 250);
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    this.isUrgent = false;

    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch (e) {}
    }

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
      } catch (e) {}
    }
  }
}

export const bgmManager = new BgmManager();
