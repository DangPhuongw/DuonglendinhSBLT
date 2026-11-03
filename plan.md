# PROJECT PLAN & AI AGENT SPECIFICATION: GAME "OLYMPIA NỘI BỘ" (v1.1)

> **Hướng dẫn cho AI Agent (Cursor / Windsurf / Claude Code / Copilot):**
> Tài liệu này là nguồn chân lý duy nhất (Single Source of Truth) về kiến trúc, luật chơi, máy trạng thái và lộ trình triển khai của dự án **Olympia Nội Bộ (v1.1)**. Khi viết code, tạo file hoặc kiểm thử, AI Agent bắt buộc phải tuân thủ nghiêm ngặt các quy tắc và thông số trong file này.

---

## 1. Chỉ thị Cốt lõi & Kiến trúc Hệ thống (Core Directives)

### 1.1. Mục tiêu & Phạm vi
* **Mục tiêu:** Xây dựng web game thời gian thực cho nội bộ (1 phòng gồm 5 người chơi, hỗ trợ chạy từ 2–5 người để kiểm thử), mô phỏng 4 vòng thi *Đường lên đỉnh Olympia* (Khởi động, Vượt chướng ngại vật, Tăng tốc, Về đích) kèm Câu hỏi phụ.
* **Không đăng nhập (No-Auth):** Người tạo phòng nhận mã 6 ký tự và link (`https://<domain>/r/ABC123`). Người chơi chỉ cần nhập tên, nhận ghế từ 1–5 và lưu `token` vào `localStorage` để tự động kết nối lại nếu tải lại trang.
* **Tự động hóa 100% (No-MC):** Hệ thống tự động điều khiển đồng hồ, chuông và chấm điểm. Chủ phòng cũng là một người chơi bình thường, chỉ có thêm quyền nạp bộ đề và bấm nút "Bắt đầu" (hoặc sửa kết quả chấm trong 10 giây sau khi công bố).
* **Ngoài phạm vi (Out of Scope):** Không làm hệ thống tài khoản, không lưu lịch sử dài hạn qua Database, không mở quy mô lớn nhiều phòng, bỏ câu hỏi thực hành, không làm ứng dụng di động riêng.

### 1.2. Nguyên tắc Kỹ thuật Bắt buộc
1. **Bảo mật đáp án (G1):** Máy chủ quyết định mọi kết quả (đồng hồ, thứ tự chuông, chấm điểm). **Tuyệt đối không gửi đáp án (`answer`, `alternatives`) xuống Client trước trạng thái `REVEAL`**, kể cả đối với Chủ phòng.
2. **Xử lý tuần tự (Event Queue):** Mỗi phòng là một máy trạng thái (State Machine) chạy tuần tự. Mọi sự kiện từ người chơi hoặc bộ đếm giờ (`timer`) phải đi qua một hàng đợi sự kiện (queue) của phòng đó để tránh lỗi tranh chấp dữ liệu (race condition).
3. **Hàm thuần (Pure Functions):** Toàn bộ logic tính điểm và chuẩn hóa/so khớp đáp án phải được viết dưới dạng hàm thuần (không phụ thuộc Socket hay I/O) để kiểm thử đơn vị (Unit Test) 100% bằng Vitest.
4. **Lưu trữ & Phục hồi:** Lưu trạng thái trong bộ nhớ máy chủ (in-memory) kết hợp ghi snapshot ra file JSON mỗi khi chuyển trạng thái để tự động khôi phục khi máy chủ khởi động lại. Không dùng cơ sở dữ liệu hay Redis.

### 1.3. Công nghệ Sử dụng (Tech Stack)
* **Ngôn ngữ:** TypeScript (dùng chung thư mục `shared/` chứa kiểu dữ liệu và hằng số cho cả Client & Server).
* **Backend:** Node.js 20 + Socket.IO.
* **Frontend:** React + Vite + Zustand + Tailwind CSS.
* **Đề thi & Media:** Đọc từ file JSON hoặc Excel (6 sheet); ảnh và video (MP4 < 20 MB) lưu trong thư mục `uploads/` của từng phòng.
* **Kiểm thử:** Vitest (Unit Test luật tính điểm, máy trạng thái, chuẩn hóa chuỗi) + Playwright (E2E & kiểm thử nhiều trình duyệt bấm chuông đồng thời).
* **Triển khai:** Docker chạy 1 tiến trình duy nhất trên VPS (1 vCPU, 1 GB RAM) hoặc Render / Railway / Fly.io (hỗ trợ WebSocket lâu dài, không dùng Serverless), cấp HTTPS qua Caddy hoặc chứng chỉ nền tảng.

---

## 2. Thông số Mặc định & Cấu hình (`shared/config.ts`)

Mọi thông số thời gian và điểm số phải được đặt trong file cấu hình tập trung:

```typescript
export const GAME_CONFIG = {
  MAX_PLAYERS: 5,
  MIN_PLAYERS_FOR_TEST: 2,
  NETWORK_GRACE_MS: 300,           // Bù trễ mạng khi nhận đáp án sau deadline
  DISCONNECT_HOLD_SECONDS: 60,     // Giữ ghế 60s khi mất kết nối (G15)
  ROOM_IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000, // Tự xóa phòng sau 2 giờ không hoạt động
  HOST_OVERRIDE_WINDOW_SECONDS: 10,// Thời gian chủ phòng được sửa kết quả chấm sau REVEAL
  READY_COUNTDOWN_SECONDS: 3,      // Đếm ngược sau khi tất cả bấm Sẵn sàng

  KHOI_DONG: {
    RIENG_QUESTIONS_PER_PLAYER: 5,
    RIENG_TIME_SECONDS: 15,
    RIENG_CORRECT_POINTS: 10,
    RIENG_WRONG_POINTS: 0,
    CHUNG_QUESTIONS: 10,
    CHUNG_BUZZ_SECONDS: 15,
    CHUNG_ANSWER_SECONDS: 15,
    CHUNG_CORRECT_POINTS: 10,
    CHUNG_WRONG_OR_TIMEOUT_POINTS: -5, // G2: Trừ 5 điểm và qua câu mới ngay
  },

  VCNV: {
    ROW_COUNT: 4,
    ROW_TIME_SECONDS: 15,
    ROW_CORRECT_POINTS: 10,
    CNV_ANSWER_SECONDS: 15,
    CNV_POINTS_BY_ROWS_DONE: [60, 60, 50, 40, 30], // Index = số hàng ngang đã hỏi xong (1->60, 2->50, 3->40, 4->30)
    CENTER_TIME_SECONDS: 15,
    CENTER_CORRECT_POINTS: 10,
    FINAL_GUESS_SECONDS: 15,
    FINAL_GUESS_CORRECT_POINTS: 20,
  },

  TANG_TOC: {
    QUESTION_COUNT: 4,
    TIME_SECONDS: 30,
    REVEAL_SECONDS: 6,
    TIE_THRESHOLD_MS: 50,          // G8: Nộp cách nhau <= 50ms tính đồng hạng
    POINTS_BY_RANK: [30, 25, 20, 15, 10],
  },

  VE_DICH: {
    CHOOSE_PACKAGE_SECONDS: 20,
    DEFAULT_PACKAGE: 40 as const,
    PACKAGES: {
      40: [10, 10, 20],
      60: [10, 20, 30],
      80: [20, 30, 30],
    },
    STAR_DECISION_SECONDS: 10,
    QUESTION_TIME_BY_POINTS: {
      10: 10,
      20: 15,
      30: 20,
    } as Record<number, number>,
    STEAL_BUZZ_SECONDS: 5,
    STEAL_ANSWER_SECONDS: 10,
  },

  TIEBREAK: {
    MAX_QUESTIONS: 3,
    WAIT_SIGNAL_SECONDS: 3,        // G14: Bấm chuông trong 3s này bị mất quyền câu đó
    BUZZ_OPEN_SECONDS: 15,
    ANSWER_SECONDS: 10,
  },
};
```

---

## 3. Mô hình Dữ liệu Dùng chung (`shared/types.ts`)

```typescript
export type RoundType = 'LOBBY' | 'KD_RIENG' | 'KD_CHUNG' | 'VCNV' | 'TANG_TOC' | 'VE_DICH' | 'TIEBREAK' | 'FINISHED';

export interface Player {
  id: string;
  name: string;
  seat: 1 | 2 | 3 | 4 | 5;
  token: string;
  connected: boolean;
  disconnectedAt?: number;
  ready: boolean;
  mediaLoaded?: boolean;
  eliminatedVcnv: boolean;
  starUsed: boolean;
  score: number;
  roundScores: {
    kd: number;
    vcnv: number;
    tt: number;
    vd: number;
  };
}

export interface Question {
  id: string;
  type: 'mcq' | 'text';
  prompt: string;
  options?: [string, string, string, string]; // A, B, C, D
  answer: string;                             // Chỉ lưu ở Server, xóa khi gửi xuống Client trước REVEAL
  alternatives: string[];                     // Các đáp án tương đương
  ignoreDiacritics?: boolean;                 // Tùy chọn bỏ qua dấu tiếng Việt theo câu
  media?: string;                             // Đường dẫn file ảnh/video trong thư mục uploads
  timeLimit?: number;
  points?: 10 | 20 | 30;
}

export interface QuestionSet {
  id: string;
  title: string;
  khoiDong: {
    rieng: Question[][]; // [5 người][5 câu]
    chung: Question[];   // [10 câu]
  };
  vcnv: {
    rows: Question[];    // 4 hàng ngang
    center: Question;    // 1 câu trung tâm
    obstacle: Question;  // Chướng ngại vật (CNV)
    image: string;       // Hình ảnh chia 5 mảnh
  };
  tangToc: Question[];   // 4 câu
  veDich: {
    pool10: Question[];  // Tối thiểu 10 câu
    pool20: Question[];  // Tối thiểu 5 câu (khuyến nghị 10)
    pool30: Question[];  // Tối thiểu 10 câu
  };
  tieBreak: Question[];  // Tối thiểu 3 câu
}

export interface ScoreEvent {
  id: string;
  round: RoundType;
  questionId: string;
  playerId: string;
  delta: number;
  reason: string;        // 'correct' | 'wrong' | 'star_correct' | 'star_wrong' | 'steal_correct' | 'steal_wrong' | 'host_override'
  at: number;
}

export interface Room {
  code: string;          // 6 ký tự in hoa/số
  hostId: string;
  status: RoundType;
  players: Player[];
  questionSetId: string;
  state: {
    round: RoundType;
    subPhase: string;
    deadline: number | null; // Timestamp của Server
    currentQuestion?: Omit<Question, 'answer' | 'alternatives'>;
    activePlayerId?: string;
    buzzerLockedBy?: string | null;
  };
  history: ScoreEvent[];
  createdAt: number;
  updatedAt: number;
}
```

---

## 4. Máy Trạng Thái & Luồng Chơi (State Machine)

### 4.1. Luồng Cấp Phòng (Macro Flow)
`LOBBY` $\rightarrow$ `READY(KD)` $\rightarrow$ `KD_RIENG` $\rightarrow$ `KD_CHUNG` $\rightarrow$ `SCORE` $\rightarrow$ `READY(VCNV)` $\rightarrow$ `VCNV` $\rightarrow$ `SCORE` $\rightarrow$ `READY(TT)` $\rightarrow$ `TANG_TOC` $\rightarrow$ `SCORE` $\rightarrow$ `READY(VD)` $\rightarrow$ `VE_DICH` $\rightarrow$ `[TIEBREAK]` $\rightarrow$ `FINISHED`

* Ở mọi màn `READY(...)`, tất cả người chơi đang kết nối phải bấm **Sẵn sàng** (và trình duyệt báo đã tải xong media của vòng đó) thì vòng mới bắt đầu sau 3 giây đếm ngược. Nếu một người mất kết nối quá 60 giây, chủ phòng có nút **Bỏ qua người vắng mặt** để tiếp tục.

### 4.2. Trạng thái con & Luật chi tiết từng Vòng

#### Vòng 1: Khởi Động (`KD_RIENG` & `KD_CHUNG`)
1. **Lượt riêng (`KD_RIENG` - G3, G4):**
   * Chuỗi trạng thái: `TURN_INTRO (3s)` $\rightarrow$ `QUESTION (15s)` $\rightarrow$ `REVEAL (3s)` (lặp 5 câu/người, lần lượt từ ghế 1 đến ghế 5).
   * Chỉ người đang đến lượt được chọn A/B/C/D; chọn 1 đáp án là chốt ngay không đổi được.
   * Điểm: Đúng $+10$, Sai hoặc hết giờ $0$.
2. **Lượt chung (`KD_CHUNG` - G2):**
   * Gồm 10 câu. Chuỗi trạng thái: `QUESTION_BUZZ (15s)` $\rightarrow$ nếu có người bấm chuông chuyển sang `ANSWERING (15s)` $\rightarrow$ `REVEAL (3s)`; nếu hết 15s không ai bấm chuyển sang `SKIP_REVEAL (3s)` $\rightarrow$ câu tiếp theo.
   * Người giành chuông có 15s chọn A/B/C/D. Đúng $+10$. Sai hoặc hết 15s: bị trừ $-5$ điểm, câu hỏi kết thúc ngay và chuyển sang câu mới (**không** chuyển quyền cho người khác).

#### Vòng 2: Vượt Chướng Ngại Vật (`VCNV` - G5, G6, G7)
* Chuỗi trạng thái: `PICK_ROW` $\rightarrow$ `ROW_QUESTION (15s)` $\rightarrow$ `ROW_REVEAL (4s)` $\rightarrow$ `[nếu có chuông chờ] CNV_ANSWERING (15s)` $\rightarrow$ `CNV_RESULT` $\rightarrow$ lặp hết 4 hàng $\rightarrow$ `CENTER_QUESTION (15s)` $\rightarrow$ `CENTER_REVEAL` $\rightarrow$ `FINAL_GUESS (15s)` $\rightarrow$ `END`.
* **Hàng ngang:** Thứ tự 4 hàng ngang được máy chủ random khi bắt đầu vòng. Ô chữ hiển thị số ô bằng số ký tự của đáp án (không tính dấu cách). Mọi người chưa bị loại cùng nhập trong 15s (được sửa đến khi hết giờ), ai đúng $+10$. Có ít nhất 1 người đúng thì mở chữ và mở mảnh ghép hình tương ứng; không ai đúng thì chỉ hiện đáp án chữ, không mở mảnh hình.
* **Chuông CNV (G5, G6, G7):**
  * Chỉ mở từ sau khi hàng ngang đầu tiên đã được hỏi.
  * Người bấm chuông đầu tiên lập tức khóa chuông của tất cả người khác và có 15s nhập đáp án CNV.
  * **Lưu ý G7:** Nếu bấm chuông khi đang chạy 1 hàng ngang, hàng ngang đó vẫn chạy hết 15s và chấm điểm bình thường, sau đó mới mở 15s cho người bấm chuông nhập CNV; hàng ngang vừa hỏi được tính vào số hàng đã hỏi xong.
  * Điểm giải đúng CNV theo số hàng ngang đã hỏi xong: 1 hàng = $+60$, 2 hàng = $+50$, 3 hàng = $+40$, 4 hàng = $+30$. Đúng sẽ mở toàn bộ hình và kết thúc vòng ngay.
  * Trả lời CNV sai hoặc hết giờ: người đó bị loại khỏi toàn bộ phần còn lại của vòng VCNV (`eliminatedVcnv = true`: không trả lời hàng ngang, câu trung tâm, không bấm chuông nữa) và chuông mở lại cho những người chưa bị loại.
* **Câu trung tâm & Pha đoán cuối:** Sau 4 hàng chưa ai giải được CNV sẽ hỏi câu trung tâm (15s, mọi người chưa bị loại cùng nhập, đúng $+10$ và mở mảnh trung tâm). Tiếp theo là `FINAL_GUESS` (15s): chuông mở, ai bấm trước nhập đáp án CNV (đồng hồ 15s pha đoán cuối tạm dừng trong lúc người đó nhập), đúng $+20$, sai bị loại và đồng hồ chạy tiếp cho người còn lại.

#### Vòng 3: Tăng Tốc (`TANG_TOC` - G8)
* 4 câu (nhìn nhanh ảnh, sắp xếp, suy luận, đoạn băng video).
* Chuỗi trạng thái: `QUESTION (30s)` $\rightarrow$ `REVEAL (6s, hiện bảng thời gian nộp)` $\rightarrow$ câu tiếp.
* Mọi người cùng nhập và được sửa đáp án nhiều lần trong 30s; máy chủ lấy lần nộp cuối cùng và timestamp của lần nộp đó.
* **Tính điểm & Đồng hạng (G8):** Xếp hạng người đúng theo thời gian nộp từ thấp đến cao với mức điểm `30 - 25 - 20 - 15 - 10`. Hai lần nộp cách nhau $\le 50\text{ ms}$ được coi là đồng hạng và nhận cùng mức điểm; người kế tiếp nhận mức điểm theo thứ hạng thực (ví dụ: 2 người đồng hạng nhất cùng nhận $30$, người thứ ba nhận $20$).
* Màn công bố hiển thị thời gian nộp tính bằng giây với 2 chữ số thập phân (ví dụ: `4.25s`).

#### Vòng 4: Về Đích (`VE_DICH` - G9, G10, G11, G12, G13)
* **Thứ tự thi (G9):** Sắp xếp người chơi theo tổng điểm sau Tăng tốc từ cao xuống thấp; nếu bằng điểm thì ưu tiên người có số ghế (`seat`) nhỏ hơn.
* Chuỗi trạng thái mỗi lượt: `TURN_INTRO` $\rightarrow$ `CHOOSE_PACKAGE (20s)` $\rightarrow$ lặp 3 câu: `STAR_DECISION (10s)` $\rightarrow$ `QUESTION (10/15/20s)` $\rightarrow$ `[nếu đúng] REVEAL` | `[nếu sai/hết giờ] STEAL_BUZZ (5s)` $\rightarrow$ `[nếu có chuông] STEAL_ANSWER (10s)` $\rightarrow$ `REVEAL`.
* **Chọn gói:** Gói `40` ($10-10-20$), Gói `60` ($10-20-30$), Gói `80` ($20-30-30$). Hết 20s hoặc mất kết nối sẽ tự động chọn gói `40`. Máy chủ bốc ngẫu nhiên câu hỏi chưa dùng từ ngân hàng câu hỏi theo mức điểm.
* **Ngôi sao hy vọng:** Mỗi người được đặt 1 lần trong cả vòng thi. Thời gian câu hỏi: câu $10\text{đ} = 10\text{s}$, câu $20\text{đ} = 15\text{s}$, câu $30\text{đ} = 20\text{s}$. Người đang thi được đổi đáp án trong thời gian câu hỏi, máy lấy lần nộp cuối.
* **Giành quyền (G11):** Nếu người thi trả lời sai hoặc hết giờ, 4 người còn lại có 5s bấm chuông; người bấm nhanh nhất có 10s nhập đáp án và **chỉ tính lần gửi đầu tiên**.
* **Bảng tính điểm cho câu hỏi có giá trị $p$ ($A$ là người đang thi, $B$ là người giành quyền - Điểm được phép âm theo G13):**

| Trường hợp | Ngôi sao | $A$ trả lời | Giành quyền ($B$) | Biến động điểm $A$ | Biến động điểm $B$ |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | Không | Đúng | - | $+p$ | $0$ |
| 2 | Không | Sai / Hết giờ | Không ai bấm | $0$ | $0$ |
| 3 | Không | Sai / Hết giờ | $B$ trả lời Đúng | $-p$ | $+p$ |
| 4 | Không | Sai / Hết giờ | $B$ trả lời Sai / Hết giờ | $0$ | $-p/2$ |
| 5 | Có | Đúng | - | $+2p$ | $0$ |
| 6 | Có | Sai / Hết giờ | Không ai bấm | $-p$ | $0$ |
| 7 | Có | Sai / Hết giờ | $B$ trả lời Đúng | $-p$ *(chỉ trừ 1 lần - G12)* | $+p$ |
| 8 | Có | Sai / Hết giờ | $B$ trả lời Sai / Hết giờ | $-p$ | $-p/2$ |

#### Câu Hỏi Phụ (`TIEBREAK` - G14)
* Chỉ kích hoạt khi có $\ge 2$ người bằng điểm cao nhất sau vòng Về đích (chỉ những người này được tham gia).
* Tối đa 3 câu. Chuỗi trạng thái mỗi câu: `WAIT_SIGNAL (3s)` $\rightarrow$ `BUZZ_OPEN (15s)` $\rightarrow$ `ANSWERING (10s)` $\rightarrow$ `REVEAL`.
* Khi câu hỏi hiện ra sẽ có dòng chữ **"Chờ hiệu lệnh"** trong 3 giây: ai bấm chuông trong 3 giây này sẽ bị tước quyền bấm chuông ở câu đó. Sau 3 giây phát hiệu lệnh **BẤM CHUÔNG** (15s).
* Người bấm hợp lệ đầu tiên có 10s nhập đáp án: đúng sẽ thắng chung cuộc ngay (`FINISHED`); sai hoặc hết giờ sẽ chuyển sang câu phụ tiếp theo.
* Nếu hết 3 câu vẫn chưa có người thắng, chuyển sang `DRAW_LOTS`: máy chủ random người thắng và phát hiệu ứng quay số trên giao diện.

---

## 5. Thuật toán Đồng bộ, Chuông & Chấm điểm

### 5.1. Đồng bộ Đồng hồ (`clockSync`)
* Khi kết nối và mỗi 30 giây sau đó, Client gửi `time:ping` 5 lần liên tiếp lên Server.
* Client chọn lần ping có độ trễ khứ hồi (RTT) thấp nhất để tính độ lệch đồng hồ `serverOffset`.
* Server luôn gửi hạn chót dạng timestamp tuyệt đối (`deadline`). Client hiển thị đồng hồ đếm ngược theo công thức: `remaining = deadline - (Date.now() + serverOffset)`.
* Server chấp nhận đáp án nộp trước thời điểm `deadline + 300ms` (bù trễ mạng).

### 5.2. Hàm chuẩn hóa và chấm đáp án tự động (`answerMatcher.ts`)
```typescript
export function normalizeAnswer(input: string, options?: { isVcnvRow?: boolean; ignoreDiacritics?: boolean }): string {
  let str = input.normalize('NFC').trim().replace(/\s+/g, ' ').toUpperCase();
  if (options?.ignoreDiacritics) {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
  }
  if (options?.isVcnvRow) {
    str = str.replace(/\s+/g, ''); // Hàng ngang VCNV không tính dấu cách
  }
  return str;
}
```
* So khớp tuyệt đối chuỗi đã chuẩn hóa của người chơi với đáp án chính (`answer`) hoặc bất kỳ phần tử nào trong `alternatives[]`.
* Sau khi `REVEAL`, Chủ phòng có nút **"Sửa kết quả chấm"** hiển thị trong 10 giây để đảo kết quả (Đúng $\leftrightarrow$ Sai) cho trường hợp hy hữu máy chấm sai; thao tác này tự động tính lại điểm và ghi `ScoreEvent` với lý do `'host_override'`.

---

## 6. Giao thức Sự kiện Socket.IO

| Chiều | Tên sự kiện | Payload & Ý nghĩa |
| :--- | :--- | :--- |
| **Client $\rightarrow$ Server** | `room:create` / `room:join` | `{ name, roomCode? }` $\rightarrow$ Trả về `{ token, seat, roomCode }` |
| **Client $\rightarrow$ Server** | `room:rejoin` | `{ roomCode, token }` $\rightarrow$ Khôi phục kết nối cho ghế cũ |
| **Client $\rightarrow$ Server** | `room:start` | Chủ phòng bắt đầu trận đấu từ `LOBBY` |
| **Client $\rightarrow$ Server** | `player:ready` | `{ mediaLoaded: boolean }` $\rightarrow$ Xác nhận sẵn sàng vào vòng mới |
| **Client $\rightarrow$ Server** | `answer:submit` | `{ questionId, content }` $\rightarrow$ Gửi đáp án (1 lần hoặc nhiều lần tùy vòng) |
| **Client $\rightarrow$ Server** | `buzz` | `{ questionId }` $\rightarrow$ Bấm chuông giành quyền |
| **Client $\rightarrow$ Server** | `vd:choosePackage` | `{ packagePoints: 40 \| 60 \| 80 }` |
| **Client $\rightarrow$ Server** | `vd:setStar` | `{ useStar: boolean }` |
| **Client $\rightarrow$ Server** | `host:overrideScore` | `{ questionId, playerId, isCorrect }` $\rightarrow$ Chủ phòng sửa kết quả trong 10s |
| **Client $\rightarrow$ Server** | `host:skipAbsent` | `{ playerId }` $\rightarrow$ Bỏ qua người mất kết nối $>60\text{s}$ ở màn Sẵn sàng |
| **Client $\rightarrow$ Server** | `time:ping` | `{ clientSentAt }` $\rightarrow$ Phục vụ đồng bộ đồng hồ |
| **Server $\rightarrow$ Client** | `state:sync` | Toàn bộ trạng thái công khai của phòng (đã ẩn đáp án câu chưa mở) |
| **Server $\rightarrow$ Client** | `phase:change` | `{ round, subPhase, deadline, question? }` |
| **Server $\rightarrow$ Client** | `buzz:won` / `buzz:rejected` | `{ winnerId, winnerName, diffMs? }` / `{ reason }` |
| **Server $\rightarrow$ Client** | `answer:ack` | `{ receivedAt }` $\rightarrow$ Xác nhận máy chủ đã nhận đáp án |
| **Server $\rightarrow$ Client** | `reveal` | `{ correctAnswer, results: Array<{ playerId, answer, isCorrect, timeSec?, delta }> }` |
| **Server $\rightarrow$ Client** | `score:update` | `{ scores, lastEvents: ScoreEvent[] }` |
| **Server $\rightarrow$ Client** | `player:update` | Cập nhật trạng thái kết nối, sẵn sàng, bị loại VCNV, đổi chủ phòng |

---

## 7. Lộ trình Triển khai theo Milestone (Task Breakdown cho AI Agent)

### [ ] Milestone 0: Khởi tạo Dự án & Thiết kế Lõi (4 ngày)
* Khởi tạo cấu trúc thư mục monorepo (`client/`, `server/`, `shared/`).
* Viết đầy đủ `shared/types.ts` và `shared/config.ts`.
* Thiết kế khung `RoomStateMachine` và `EventQueue` tuần tự cho từng phòng trên Server.

### [ ] Milestone 1: Phòng, Sảnh, Đồng hồ, Chuông & Chấm điểm (10 ngày)
* Xây dựng API/Socket tạo phòng, vào phòng (ghế 1–5), lưu `token` vào lại phòng và tự động chuyển quyền chủ phòng khi chủ phòng thoát.
* Xây dựng cơ chế `time:ping` đồng bộ đồng hồ và bù trễ mạng $300\text{ ms}$.
* Lập trình cơ chế khóa chuông nguyên tử (atomic lock) và ghi nhận độ chênh mili-giây vào biên bản.
* Viết hàm thuần `answerMatcher.ts` (chuẩn hóa Unicode NFC) kèm bộ Unit Test Vitest cho tiếng Việt (Unikey, macOS, mobile).
* Xây dựng cơ chế ghi/đọc snapshot JSON mỗi khi đổi trạng thái.

### [ ] Milestone 2: Vòng Khởi Động (4 ngày)
* Lập trình máy trạng thái và giao diện `KD_RIENG` (5 câu/người, 15s, chọn A–D chốt ngay, đúng $+10$).
* Lập trình `KD_CHUNG` (10 câu, 15s bấm chuông + 15s trả lời, đúng $+10$, sai/hết giờ $-5$ và qua câu mới ngay).

### [ ] Milestone 3: Vòng Vượt Chướng Ngại Vật (6 ngày)
* Lập trình random 4 hàng ngang, giao diện ô chữ + hình ảnh chia 5 mảnh (4 góc + trung tâm).
* Lập trình trả lời hàng ngang (15s, đúng $+10$, mở chữ và mảnh ghép nếu có ít nhất 1 người đúng).
* Lập trình chuông CNV (mở sau hàng 1, nếu bấm khi đang chạy hàng ngang thì đợi hết hàng ngang mới nhập CNV 15s, điểm $60/50/40/30$, sai bị loại khỏi vòng).
* Lập trình câu trung tâm ($+10$) và pha đoán cuối 15s ($+20$).

### [ ] Milestone 4: Vòng Tăng Tốc (3 ngày)
* Xây dựng cơ chế tải trước (preload) ảnh và video ngay tại màn `READY(TT)`.
* Lập trình nhận nhiều lần nộp trong 30s, lấy lần nộp cuối và xếp hạng $30-25-20-15-10$ với ngưỡng đồng hạng $50\text{ ms}$.
* Thiết kế bảng công bố thời gian nộp (2 chữ số thập phân).

### [ ] Milestone 5: Vòng Về Đích & Câu Hỏi Phụ (7 ngày)
* Lập trình sắp xếp thứ tự thi (điểm cao xuống thấp, bằng điểm ưu tiên ghế nhỏ).
* Lập trình chọn gói $40/60/80$, bốc câu hỏi từ ngân hàng đề, đặt Ngôi sao hy vọng, giành quyền trả lời (5s bấm + 10s nhập lần đầu) và 8 trường hợp tính điểm.
* Lập trình luồng Câu hỏi phụ (3s "Chờ hiệu lệnh" phạt bấm sớm, 15s bấm, 10s trả lời, tối đa 3 câu, bốc thăm ngẫu nhiên nếu hòa).

### [ ] Milestone 6: Nạp Đề, Hoàn thiện Giao diện & Biên bản (6 ngày)
* Xây dựng bộ đọc và kiểm tra đề từ file Excel (6 sheet) / JSON + file zip media; tích hợp sẵn 1 bộ đề mẫu.
* Hoàn thiện giao diện thanh bảng điểm 5 người cố định, phím tắt (`Space` bấm chuông, `1–4` chọn A–D), âm thanh và nút tắt tiếng.
* Lập trình nút Chủ phòng sửa kết quả chấm trong 10s, màn hình Kết quả (bục vinh quang) và xuất biên bản trận đấu ra file CSV.

### [ ] Milestone 7: Kiểm thử Tự động & Triển khai (7 ngày)
* Viết đầy đủ Unit Test bằng Vitest cho toàn bộ hàm tính điểm và máy trạng thái.
* Viết kịch bản Playwright: 5 bot bấm chuông đồng thời 100 lần (đảm bảo mỗi lần chỉ có đúng 1 người thắng chuông).
* Viết `Dockerfile`, cấu hình HTTPS và triển khai thử nghiệm cho 5 người chơi thật.