// Cinematic Web Audio BGM Manager for Olympia Quiz Show
class BgmManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private enabled: boolean = true;
  private timerId: any = null;
  private isUrgent: boolean = false;

  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('olympia_bgm');
      this.enabled = saved !== null ? saved === 'true' : true;
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
      this.ctx.resume();
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
    if (!this.enabled || this.isPlaying) return;

    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;

    try {
      // Master BGM gain - gentle background volume
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.2);
      this.masterGain.connect(ctx.destination);

      // Low suspense atmospheric drone (2 harmonics: 55Hz A1 + 110Hz A2)
      this.droneGain = ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.04, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);

      this.droneOsc1 = ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, ctx.currentTime);

      this.droneOsc2 = ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(82.4, ctx.currentTime); // E2 fifth

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(filter);
      filter.connect(this.masterGain);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // Start periodic countdown pulse ticker
      this.schedulePulse();
    } catch (e) {
      console.warn('BGM start error:', e);
    }
  }

  private schedulePulse() {
    if (!this.isPlaying) return;

    this.playBeat();

    // Regular interval: 1000ms; Urgent (<5s): 500ms
    const interval = this.isUrgent ? 500 : 1000;
    this.timerId = setTimeout(() => {
      this.schedulePulse();
    }, interval);
  }

  private playBeat() {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;

    const now = ctx.currentTime;

    try {
      // Subtle rhythmic clock pulse / heartbeat
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startFreq = this.isUrgent ? 110 : 85;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      const vol = this.isUrgent ? 0.25 : 0.15;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);

      // Subtle high-hat tick
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tickOsc.type = 'triangle';
      tickOsc.frequency.setValueAtTime(800, now);
      tickGain.gain.setValueAtTime(0.02, now);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      tickOsc.connect(tickGain);
      tickGain.connect(this.masterGain);
      tickOsc.start(now);
      tickOsc.stop(now + 0.04);
    } catch (e) {
      // Ignore
    }
  }

  public setUrgency(urgent: boolean) {
    this.isUrgent = urgent;
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isUrgent = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    const ctx = this.ctx;
    if (ctx && this.masterGain) {
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        setTimeout(() => {
          try {
            this.droneOsc1?.stop();
            this.droneOsc1?.disconnect();
            this.droneOsc2?.stop();
            this.droneOsc2?.disconnect();
          } catch (e) {}
          this.droneOsc1 = null;
          this.droneOsc2 = null;
        }, 350);
      } catch (e) {}
    }
  }
}

export const bgmManager = new BgmManager();
