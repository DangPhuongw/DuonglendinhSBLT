export interface QuestionLike {
  prompt?: string;
  text?: string;
  options?: string[] | Record<string, string>;
}

// Bảng phiên âm tiếng Việt cho các danh từ riêng, thuật ngữ, địa danh phổ biến trong các bộ đề Olympia
const PHONETIC_MAP: Array<[RegExp, string]> = [
  // Thành phố, địa danh thế giới
  [/\bParis\b/gi, 'Pa-ri'],
  [/\bLondon\b/gi, 'Lon-đơn'],
  [/\bNew York\b/gi, 'Niu Oóc'],
  [/\bWashington\b/gi, 'Oa-sinh-tơn'],
  [/\bTokyo\b/gi, 'Tô-ki-ô'],
  [/\bSeoul\b/gi, 'Xơ-un'],
  [/\bBeijing\b/gi, 'Bắc Kinh'],
  [/\bMoscow\b/gi, 'Mát-xcơ-va'],
  [/\bBerlin\b/gi, 'Béc-lin'],
  [/\bRome\b/gi, 'Rô-ma'],
  [/\bMadrid\b/gi, 'Ma-đrít'],
  [/\bSingapore\b/gi, 'Xinh-ga-po'],
  [/\bBangkok\b/gi, 'Băng Cốc'],
  [/\bSydney\b/gi, 'Xít-ni'],
  [/\bOttawa\b/gi, 'Ốt-ta-oa'],
  [/\bCairo\b/gi, 'Cai-rô'],
  [/\bEverest\b/gi, 'Ê-vơ-rét'],
  [/\bAmazon\b/gi, 'A-ma-dôn'],

  // Nhà bác học, danh nhân, nghệ sĩ
  [/\bNewton\b/gi, 'Niu-tơn'],
  [/\bEinstein\b/gi, 'Anh-xtanh'],
  [/\bDarwin\b/gi, 'Đác-uyn'],
  [/\bEdison\b/gi, 'Ê-đi-xơn'],
  [/\bTesla\b/gi, 'Tét-la'],
  [/\bGalileo\b/gi, 'Ga-li-lê'],
  [/\bArchimedes\b/gi, 'Ác-si-mét'],
  [/\bPythagoras\b/gi, 'Pi-ta-go'],
  [/\bShakespeare\b/gi, 'Sếch-xpia'],
  [/\bNobel\b/gi, 'Nô-ben'],
  [/\bBeethoven\b/gi, 'Bét-thô-ven'],
  [/\bMozart\b/gi, 'Mô-za'],
  [/\bPicasso\b/gi, 'Pi-cát-xô'],

  // Tổ chức quốc tế, sự kiện
  [/\bOlympic\b/gi, 'Ô-lim-pích'],
  [/\bOlympia\b/gi, 'Ô-lim-pi-a'],
  [/\bWorld Cup\b/gi, 'Uôn Cắp'],
  [/\bFIFA\b/gi, 'Phi-pha'],
  [/\bUEFA\b/gi, 'U-ê-pha'],
  [/\bUNESCO\b/gi, 'U-nét-xcô'],
  [/\bUNICEF\b/gi, 'U-ni-xép'],
  [/\bNASA\b/gi, 'Na-sa'],
  [/\bWHO\b/gi, 'W-H-O'],
  [/\bWTO\b/gi, 'W-T-O'],
  [/\bASEAN\b/gi, 'A-xê-an'],
  [/\bAPEC\b/gi, 'A-péc'],
  [/\bNATO\b/gi, 'Na-tô'],

  // Khoa học & Công nghệ
  [/\bDNA\b/gi, 'Đê-En-A'],
  [/\bADN\b/gi, 'A-Đê-En'],
  [/\bRNA\b/gi, 'A-En-A'],
  [/\bARN\b/gi, 'A-E-Ren'],
  [/\bCOVID(-19)?\b/gi, 'Cô-vít'],
  [/\bVirus\b/gi, 'Vi-rút'],
  [/\bInternet\b/gi, 'In-tơ-nét'],
  [/\bOnline\b/gi, 'On-lai'],
  [/\bAI\b/g, 'Ây-Ai'],
  [/\bCPU\b/gi, 'Xê-Pê-U'],
  [/\bRAM\b/gi, 'Ram'],
  [/\bROM\b/gi, 'Rom'],
  [/\bUSB\b/gi, 'U-Ét-Bê'],
  [/\bWi-?Fi\b/gi, 'Oai-Phai'],
  [/\bBluetooth\b/gi, 'Bờ-lu-tút'],
  [/\bFacebook\b/gi, 'Phây-sơ-búc'],
  [/\bGoogle\b/gi, 'Gu-gồ'],
  [/\bYouTube\b/gi, 'Du-túp'],
  [/\bTikTok\b/gi, 'Tích-tốc'],

  // Đơn vị đo lường
  [/(\d+)\s*km\/h\b/gi, '$1 ki-lô-mét trên giờ'],
  [/(\d+)\s*m\/s\b/gi, '$1 mét trên giây'],
  [/(\d+)\s*km\b/gi, '$1 ki-lô-mét'],
  [/(\d+)\s*cm\b/gi, '$1 xen-ti-mét'],
  [/(\d+)\s*mm\b/gi, '$1 mi-li-mét'],
  [/(\d+)\s*kg\b/gi, '$1 ki-lô-gam'],
  [/(\d+)\s*°C\b/gi, '$1 độ C'],
  [/(\d+)\s*%/g, '$1 phần trăm'],
];

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

    // Filter Vietnamese voices
    const viVoices = voices.filter((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (
        lang.startsWith('vi') ||
        lang.includes('vietnam') ||
        name.includes('tiếng việt') ||
        name.includes('vietnamese')
      );
    });

    if (viVoices.length > 0) {
      // Score voices to prioritize the best and most popular natural/online voices
      const getScore = (v: SpeechSynthesisVoice): number => {
        const name = v.name.toLowerCase();
        let score = 50;

        // 1. Google tiếng Việt (Chrome standard voice - extremely popular, clear, natural)
        if (name.includes('google') && (name.includes('tiếng việt') || v.lang.toLowerCase().startsWith('vi'))) {
          score += 85;
        }

        // 2. Microsoft Edge Neural voices (HoaiMy, NamMinh Online/Natural)
        if (name.includes('natural') || name.includes('online')) {
          score += 80;
          if (name.includes('hoaimy')) score += 5;
          if (name.includes('namminh')) score += 5;
        }

        // 3. Apple / Siri / Linh (macOS / iOS)
        if (name.includes('linh') || name.includes('siri') || name.includes('apple')) {
          score += 60;
        }

        // 4. Prefer remote/network voices over local offline
        if (!v.localService) {
          score += 15;
        }

        // 5. Heavily penalize old robotic Windows SAPI voice "Microsoft An" which struggles with English loanwords
        if (name.includes('microsoft an') || name.includes('an - vietnamese') || name.includes('ms an')) {
          score -= 70;
        }

        return score;
      };

      viVoices.sort((a, b) => getScore(b) - getScore(a));
      this.selectedVoice = viVoices[0];
      return this.selectedVoice;
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

  private normalizeText(text: string): string {
    let clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#+\s+/g, '')
      .trim();

    // Áp dụng phiên âm chuẩn các từ mượn / từ tiếng Anh thường gặp
    for (const [pattern, replacement] of PHONETIC_MAP) {
      clean = clean.replace(pattern, replacement);
    }

    return clean;
  }

  public speak(text: string, force: boolean = false) {
    if (!force && !this.enabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      this.stop();

      const cleanText = this.normalizeText(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Luôn đảm bảo chọn giọng tốt nhất hiện có
      if (!this.selectedVoice) {
        this.loadVoice();
      }

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      } else {
        utterance.lang = 'vi-VN';
      }

      // Tăng tốc độ đọc lên một chút (1.15) để nhịp độ thi đấu sôi nổi, dứt khoát
      utterance.rate = 1.15;
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
