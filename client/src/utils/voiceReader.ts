class VoiceReader {
  private enabled: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.enabled = localStorage.getItem('olympia_tts') === 'true';
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoice();
      };
      this.loadVoice();
    }
  }

  private loadVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Vietnamese voices (vi-VN, vi)
    this.selectedVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('vi')) ||
      voices.find((v) => v.lang.toLowerCase().includes('vi')) ||
      null;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public set isEnabled(val: boolean) {
    this.enabled = val;
    localStorage.setItem('olympia_tts', val ? 'true' : 'false');
    if (!val) {
      this.stop();
    }
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public speak(text: string) {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const cleanText = text.replace(/[*_#•?]/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.rate = 1.05; // Slightly lively pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceReader = new VoiceReader();
