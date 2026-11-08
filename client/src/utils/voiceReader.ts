export interface QuestionLike {
  prompt?: string;
  text?: string;
  options?: string[] | Record<string, string>;
}

// Bảng phiên âm tiếng Việt cho các danh từ riêng, thuật ngữ, địa danh phổ biến trong các bộ đề Olympia
const PHONETIC_MAP: Array<[RegExp, string]> = [
  // Thành phố, quốc gia, địa danh thế giới
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
  [/\bNile\b/gi, 'Nin'],
  [/\bThames\b/gi, 'Tem'],
  [/\bPacific\b/gi, 'Thái Bình Dương'],
  [/\bAtlantic\b/gi, 'Đại Tây Dương'],
  [/\bHimalaya\b/gi, 'Hi-ma-lay-a'],
  [/\bEngland\b/gi, 'Nước Anh'],
  [/\bAmerica\b/gi, 'Nước Mỹ'],
  [/\bUSA\b/gi, 'U-Ét-A'],
  [/\bUnited Kingdom\b/gi, 'Vương quốc Anh'],

  // Nhà bác học, danh nhân, nghệ sĩ, chính khách
  [/\bNewton\b/gi, 'Niu-tơn'],
  [/\bIsaac Newton\b/gi, 'Ai-dắc Niu-tơn'],
  [/\bEinstein\b/gi, 'Anh-xtanh'],
  [/\bAlbert Einstein\b/gi, 'An-be Anh-xtanh'],
  [/\bDarwin\b/gi, 'Đác-uyn'],
  [/\bCharles Darwin\b/gi, 'Sác-lơ Đác-uyn'],
  [/\bEdison\b/gi, 'Ê-đi-xơn'],
  [/\bThomas Edison\b/gi, 'Thô-mát Ê-đi-xơn'],
  [/\bTesla\b/gi, 'Tét-la'],
  [/\bNikola Tesla\b/gi, 'Ni-cô-la Tét-la'],
  [/\bGalileo\b/gi, 'Ga-li-lê'],
  [/\bArchimedes\b/gi, 'Ác-si-mét'],
  [/\bPythagoras\b/gi, 'Pi-ta-go'],
  [/\bShakespeare\b/gi, 'Sếch-xpia'],
  [/\bWilliam Shakespeare\b/gi, 'Uy-li-am Sếch-xpia'],
  [/\bNobel\b/gi, 'Nô-ben'],
  [/\bAlfred Nobel\b/gi, 'An-phờ-rét Nô-ben'],
  [/\bBeethoven\b/gi, 'Bét-thô-ven'],
  [/\bMozart\b/gi, 'Mô-za'],
  [/\bPicasso\b/gi, 'Pi-cát-xô'],
  [/\bLeonardo da Vinci\b/gi, 'Lê-ô-na-đô đa Vin-xi'],
  [/\bColumbus\b/gi, 'Cô-lôm-bô'],
  [/\bNapoleon\b/gi, 'Na-pô-lê-ông'],
  [/\bAlexander\b/gi, 'A-lếch-xăng-đơ'],
  [/\bChurchill\b/gi, 'Sớc-sin'],
  [/\bLincoln\b/gi, 'Lin-côn'],
  [/\bAbraham Lincoln\b/gi, 'A-bra-ham Lin-côn'],
  [/\bBill Gates\b/gi, 'Biu Ghết'],
  [/\bSteve Jobs\b/gi, 'Xti-vơ Dốp'],
  [/\bElon Musk\b/gi, 'I-lông Mấc'],
  [/\bMark Zuckerberg\b/gi, 'Mác Dấc-cơ-bớc'],
  [/\bCristiano Ronaldo\b/gi, 'Cri-xti-a-nô Rô-nan-đô'],
  [/\bRonaldo\b/gi, 'Rô-nan-đô'],
  [/\bMessi\b/gi, 'Méc-xi'],
  [/\bLionel Messi\b/gi, 'Li-ô-nen Méc-xi'],
  [/\bMaradona\b/gi, 'Ma-ra-đô-na'],
  [/\bPelé\b/gi, 'Pê-lê'],
  [/\bMichael Jackson\b/gi, 'Mai-cơn Giắc-xơn'],
  [/\bTaylor Swift\b/gi, 'Tay-lơ Xoíp'],
  [/\bHarry Potter\b/gi, 'Ha-ri Pót-tơ'],
  [/\bSherlock Holmes\b/gi, 'Sơ-lốc Hôm'],

  // Tổ chức quốc tế, sự kiện, giải đấu
  [/\bOlympic\b/gi, 'Ô-lim-pích'],
  [/\bOlympia\b/gi, 'Ô-lim-pi-a'],
  [/\bWorld Cup\b/gi, 'Uôn Cắp'],
  [/\bFIFA\b/gi, 'Phi-pha'],
  [/\bUEFA\b/gi, 'U-ê-pha'],
  [/\bUNESCO\b/gi, 'U-nét-xcô'],
  [/\bUNICEF\b/gi, 'U-ni-xép'],
  [/\bNASA\b/gi, 'Na-sa'],
  [/\bWHO\b/gi, 'Đúp-lê Hát O'],
  [/\bWTO\b/gi, 'Đúp-lê Tê O'],
  [/\bASEAN\b/gi, 'A-xê-an'],
  [/\bAPEC\b/gi, 'A-péc'],
  [/\bNATO\b/gi, 'Na-tô'],
  [/\bChampions League\b/gi, 'Cúp C1'],
  [/\bPremier League\b/gi, 'Ngoại hạng Anh'],
  [/\bGrammy\b/gi, 'Gram-mi'],
  [/\bOscar\b/gi, 'Ót-x-ca'],

  // Khoa học & Công nghệ, Máy tính
  [/\bDNA\b/gi, 'Đê-En-A'],
  [/\bADN\b/gi, 'A-Đê-En'],
  [/\bRNA\b/gi, 'A-En-A'],
  [/\bARN\b/gi, 'A-E-Ren'],
  [/\bCOVID(-19)?\b/gi, 'Cô-vít'],
  [/\bVirus\b/gi, 'Vi-rút'],
  [/\bInternet\b/gi, 'In-tơ-nét'],
  [/\bOnline\b/gi, 'On-lai'],
  [/\bAI\b/g, 'Ây-Ai'],
  [/\bChatGPT\b/gi, 'Chát G-P-T'],
  [/\bCPU\b/gi, 'Xê-Pê-U'],
  [/\bGPU\b/gi, 'G-P-U'],
  [/\bRAM\b/gi, 'Ram'],
  [/\bROM\b/gi, 'Rom'],
  [/\bUSB\b/gi, 'U-Ét-Bê'],
  [/\bWi-?Fi\b/gi, 'Oai-Phai'],
  [/\bBluetooth\b/gi, 'Bờ-lu-tút'],
  [/\bFacebook\b/gi, 'Phây-sơ-búc'],
  [/\bGoogle\b/gi, 'Gu-gồ'],
  [/\bYouTube\b/gi, 'Du-túp'],
  [/\bTikTok\b/gi, 'Tích-tốc'],
  [/\bInstagram\b/gi, 'In-xta-gram'],
  [/\bNetflix\b/gi, 'Nét-phơ-lích'],
  [/\bApple\b/gi, 'Ép-pồ'],
  [/\bMicrosoft\b/gi, 'Mai-crô-xốp'],
  [/\biPhone\b/gi, 'Ai-phôn'],
  [/\bAndroid\b/gi, 'An-đơ-roi'],
  [/\bLaptop\b/gi, 'Láp-tóp'],
  [/\bSmartphone\b/gi, 'Xì-mát-phôn'],
  [/\bRobot\b/gi, 'Rô-bốt'],
  [/\bWebsite\b/gi, 'Oép-sai'],
  [/\bEmail\b/gi, 'I-meo'],
  [/\bH2O\b/gi, 'Hắt Hai O'],
  [/\bCO2\b/gi, 'Xê Ô Hai'],
  [/\bO2\b/gi, 'Ô Hai'],
  [/\bpH\b/g, 'Pê Hát'],

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
