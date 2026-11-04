export interface QuestionLike {
  prompt?: string;
  text?: string;
  options?: string[] | Record<string, string>;
}

class VoiceReader {
  private enabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speaking: boolean = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('olympia_tts') : null;
    this.enabled = saved !== null ? saved === 'true' : true;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoice();
      };
      this.loadVoice();
    }
  }

  public subscribe(cb: (speaking: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.speaking));
  }

  public get isSpeaking(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return this.speaking && window.speechSynthesis.speaking;
    }
    return false;
  }

  public loadVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Natural / Online Vietnamese voices (Edge / Chrome neural)
    const naturalVi = voices.find(
      (v) =>
        (v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vietnam')) &&
        (v.name.includes('Natural') || v.name.includes('Online'))
    );
    if (naturalVi) {
      this.selectedVoice = naturalVi;
      return naturalVi;
    }

    // 2. Any Vietnamese voice (vi-VN, vi)
    const anyVi = voices.find(
      (v) => v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vi')
    );
    if (anyVi) {
      this.selectedVoice = anyVi;
      return anyVi;
    }

    this.selectedVoice = null;
    return null;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public set isEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('olympia_tts', val ? 'true' : 'false');
    }
    if (!val) {
      this.stop();
    }
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public formatQuestionText(question: QuestionLike): string {
    const qText = question.prompt || question.text || '';
    let speech = `Câu hỏi: ${qText}`;
    if (question.options) {
      if (Array.isArray(question.options)) {
        const letters = ['A', 'B', 'C', 'D'];
        const opts = question.options
          .map((opt, i) => `${letters[i]}: ${opt}`)
          .filter(Boolean)
          .join('. ');
        if (opts) speech += `. Các phương án: ${opts}`;
      } else {
        const opts = Object.entries(question.options)
          .map(([k, v]) => `${k}: ${v}`)
          .join('. ');
        if (opts) speech += `. Các phương án: ${opts}`;
      }
    }
    return speech;
  }

  public speakQuestion(question: QuestionLike, force: boolean = false) {
    const text = this.formatQuestionText(question);
    this.speak(text, force);
  }

  public speak(text: string, force: boolean = false) {
    if (!force && !this.enabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      this.stop();

      // Clean markdown formatting if any, but preserve punctuation
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#+\s+/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      if (!this.selectedVoice) {
        this.loadVoice();
      }

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.speaking = true;
        this.notify();
      };

      utterance.onend = () => {
        this.speaking = false;
        this.notify();
      };

      utterance.onerror = () => {
        this.speaking = false;
        this.notify();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      this.speaking = false;
      this.notify();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speaking = false;
      this.notify();
    }
  }
}

export const voiceReader = new VoiceReader();
