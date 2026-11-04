class BgmManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private enabled: boolean = true;
  private timerId: any = null;
  private isUrgent: boolean = false;

  // Master Gain for BGM
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;

  constructor() {
    // Default enabled unless explicitly turned off
    this.enabled = localStorage.getItem('olympia_bgm') !== 'false';
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
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
    localStorage.setItem('olympia_bgm', val ? 'true' : 'false');
    if (!val) {
      this.stop();
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

    // Master BGM gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.0); // Gentle background volume
    this.masterGain.connect(ctx.destination);

    // 1. Suspense Drone (Low atmospheric hum)
    try {
      this.droneOsc = ctx.createOscillator();
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(150, ctx.currentTime);

      this.droneOsc.type = 'triangle';
      this.droneOsc.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 note
      this.droneOsc.connect(droneFilter);
      droneFilter.connect(this.masterGain);
      this.droneOsc.start();
    } catch (e) {
      // Ignore if audio policy blocked
    }

    // 2. Start Rhythmic Tension Heartbeat Pulse
    this.schedulePulse();
  }

  private schedulePulse() {
    if (!this.isPlaying) return;

    this.playHeartbeat();

    // Regular interval: 1000ms; Urgent (<5s): 500ms
    const interval = this.isUrgent ? 550 : 1100;
    this.timerId = setTimeout(() => {
      this.schedulePulse();
    }, interval);
  }

  private playHeartbeat() {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;

    const now = ctx.currentTime;

    // Dual beat: 'thump-thump'
    [0, 0.18].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Low sub frequency drop for cinematic heartbeat
      const startFreq = idx === 0 ? 75 : 60;
      osc.frequency.setValueAtTime(startFreq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.12);

      const beatVol = idx === 0 ? 0.35 : 0.22;
      gain.gain.setValueAtTime(beatVol, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
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
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        setTimeout(() => {
          if (this.droneOsc) {
            try {
              this.droneOsc.stop();
              this.droneOsc.disconnect();
            } catch (e) {}
            this.droneOsc = null;
          }
        }, 450);
      } catch (e) {}
    }
  }
}

export const bgmManager = new BgmManager();
