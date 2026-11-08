import { voiceReader } from './voiceReader';

// Dual-Track Olympia BGM Manager
// Track 1 (Theme): /audio/theme_bgm.mp3 (Homepage, Lobby, Ready: soft volume 0.22; Podium/Finished: loud volume 0.75)
// Track 2 (Question): /audio/question_bgm.mp3 (Countdown beat: normal 0.20, ducked to 0.05 when host speaks)
class BgmManager {
  private themeAudio: HTMLAudioElement | null = null;
  private questionAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private enabled: boolean = true;
  private currentRound: string = 'LOBBY';
  private audioUnlocked: boolean = false;
  private isDucked: boolean = false;
  private fadeInterval: any = null;

  // Question countdown volume levels:
  // Normal: 0.20 (nhẹ nhàng, không lấn át)
  // Ducked: 0.05 (giảm sâu khi giọng đọc bắt đầu đọc câu hỏi)
  private readonly QUESTION_VOLUME_NORMAL = 0.20;
  private readonly QUESTION_VOLUME_DUCKED = 0.05;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('olympia_bgm');
      this.enabled = saved !== null ? saved === 'true' : true;

      // 1. Initialize Theme Audio (Olympia Theme Song)
      try {
        this.themeAudio = new Audio('/audio/theme_bgm.mp3');
        this.themeAudio.loop = true;
        this.themeAudio.volume = 0.22;
      } catch (e) {
        console.warn('Failed to init themeAudio:', e);
      }

      // 2. Initialize Question Countdown Audio (Tense beat)
      try {
        this.questionAudio = new Audio('/audio/question_bgm.mp3');
        this.questionAudio.loop = true;
        this.questionAudio.volume = this.QUESTION_VOLUME_NORMAL;
      } catch (e) {
        console.warn('Failed to init questionAudio:', e);
      }

      // 3. Audio Ducking for Question Music when Host speaks
      voiceReader.subscribe((speaking) => {
        this.setDucking(speaking);
      });

      // 4. Browser Autoplay Policy: Unlock on first user interaction
      const unlock = () => {
        if (!this.audioUnlocked) {
          this.audioUnlocked = true;

          // Prime audio elements
          [this.themeAudio, this.questionAudio].forEach((el) => {
            if (el) {
              el.play()
                .then(() => {
                  if (!this.isPlaying) {
                    el.pause();
                    el.currentTime = 0;
                  }
                })
                .catch(() => {});
            }
          });

          if (this.enabled) {
            this.updatePlayback();
          }
        }
      };

      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  // Smoothly fade question music volume up or down
  private fadeQuestionVolume(targetVolume: number, durationMs: number = 200) {
    if (!this.questionAudio) return;
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const startVolume = this.questionAudio.volume;
    const diff = targetVolume - startVolume;
    const steps = 10;
    const stepTime = durationMs / steps;
    let stepCount = 0;

    this.fadeInterval = setInterval(() => {
      stepCount++;
      if (!this.questionAudio) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        return;
      }
      const progress = stepCount / steps;
      this.questionAudio.volume = Math.max(0, Math.min(1, startVolume + diff * progress));
      if (stepCount >= steps) {
        this.questionAudio.volume = targetVolume;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepTime);
  }

  private setDucking(ducking: boolean) {
    this.isDucked = ducking;
    if (this.questionAudio && this.isPlaying) {
      // Khi giọng đọc cất tiếng: giảm sâu xuống 0.05 nhanh chóng (120ms)
      // Khi giọng đọc dứt lời: nâng nhẹ nhàng lên 0.20 (250ms)
      const target = ducking ? this.QUESTION_VOLUME_DUCKED : this.QUESTION_VOLUME_NORMAL;
      this.fadeQuestionVolume(target, ducking ? 120 : 250);
    }
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
      this.updatePlayback();
    }
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public setRound(round: string) {
    this.currentRound = round;
    this.updatePlayback();
  }

  public updatePlayback() {
    if (!this.enabled) {
      this.stop();
      return;
    }

    const round = this.currentRound;

    const isGameplayRound = [
      'KD_RIENG',
      'KD_CHUNG',
      'VCNV',
      'TANG_TOC',
      'VE_DICH',
      'TIEBREAK',
    ].includes(round);

    if (round === 'FINISHED') {
      // 1. Lúc công bố người thắng cuộc (Podium) -> Nhạc Theme Olympia với âm lượng to (0.75)
      this.isPlaying = true;
      if (this.questionAudio) {
        this.questionAudio.pause();
        this.questionAudio.currentTime = 0;
      }
      if (this.themeAudio) {
        this.themeAudio.volume = 0.75;
        this.themeAudio.play().catch(() => {});
      }
    } else if (isGameplayRound) {
      // 2. Lúc diễn ra câu hỏi -> Nhạc Question Countdown hồi hộp (bé hơn: 0.20, ducked: 0.05)
      this.isPlaying = true;
      if (this.themeAudio) {
        this.themeAudio.pause();
        this.themeAudio.currentTime = 0;
      }
      if (this.questionAudio) {
        this.questionAudio.volume = this.isDucked
          ? this.QUESTION_VOLUME_DUCKED
          : this.QUESTION_VOLUME_NORMAL;
        this.questionAudio.play().catch(() => {});
      }
    } else {
      // 3. Homepage, Phòng chờ (LOBBY), Màn hình chuẩn bị (READY) -> Nhạc Theme với âm lượng nhỏ (0.22)
      this.isPlaying = true;
      if (this.questionAudio) {
        this.questionAudio.pause();
        this.questionAudio.currentTime = 0;
      }
      if (this.themeAudio) {
        this.themeAudio.volume = 0.22;
        this.themeAudio.play().catch(() => {});
      }
    }
  }

  public start() {
    this.isPlaying = true;
    this.updatePlayback();
  }

  public stop() {
    this.isPlaying = false;
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.themeAudio) {
      try {
        this.themeAudio.pause();
      } catch (e) {}
    }
    if (this.questionAudio) {
      try {
        this.questionAudio.pause();
      } catch (e) {}
    }
  }
}

export const bgmManager = new BgmManager();
