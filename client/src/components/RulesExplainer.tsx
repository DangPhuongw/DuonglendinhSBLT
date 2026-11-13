import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, ChevronLeft, ChevronRight, Lock, Pause, Play, RotateCcw, ShieldAlert, Star, X } from 'lucide-react';
import { GAME_CONFIG } from '@olympia/shared';
import { ANTI_CHEAT_RULE } from '../utils/antiCheatRules';

/**
 * Màn giới thiệu luật có hoạt ảnh, chạy trước mỗi vòng (ở màn Sẵn sàng).
 * Mỗi vòng gồm vài "cảnh" tự chuyển như story: hình minh họa động + 1-2 câu giải thích.
 * Mọi con số (thời gian, điểm) lấy từ GAME_CONFIG nên luôn khớp với luật thật của game.
 */

const KD = GAME_CONFIG.KHOI_DONG;
const VC = GAME_CONFIG.VCNV;
const TT = GAME_CONFIG.TANG_TOC;
const VD = GAME_CONFIG.VE_DICH;
const TB = GAME_CONFIG.TIEBREAK;
const LOCK = GAME_CONFIG.BUZZ_LOCK_SECONDS;
const SCENE_MS = 7000;

interface Scene {
  title: string;
  text: React.ReactNode;
  visual: React.ReactNode;
}

// ---------- các mảnh minh họa dùng chung ----------

const d = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

/** Ô điểm bay lên (+10, -5...) */
const Points: React.FC<{ value: number; delay: number; className?: string }> = ({ value, delay, className = '' }) => (
  <span
    className={`rx-fly-up absolute font-digital font-black text-2xl sm:text-3xl tabular-nums ${
      value > 0 ? 'text-[#43E6B5]' : value < 0 ? 'text-[#FF5D8F]' : 'text-[#A6ACDB]'
    } ${className}`}
    style={d(delay)}
  >
    {value > 0 ? `+${value}` : value}
  </span>
);

const Avatar: React.FC<{ label: string; color: string; className?: string; style?: React.CSSProperties }> = ({ label, color, className = '', style }) => (
  <div
    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-heading font-black text-sm sm:text-base text-[#05060F] shrink-0 ${className}`}
    style={{ background: color, ...style }}
  >
    {label}
  </div>
);

/** Đếm ngược 3 -> 0 rồi chuông sáng lên (khóa chuông đầu mỗi lượt giành chuông). */
const BellLock: React.FC<{ accent: string; startAt?: number }> = ({ accent, startAt = 0 }) => (
  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
    <div className="rx-fade-out absolute inset-0 rounded-full bg-[#0A0D22] border-4 border-[#262E66] flex flex-col items-center justify-center" style={d(startAt + LOCK * 1000)}>
      <Lock size={16} className="text-[#6D75AD]" />
      <div className="relative h-7 w-10">
        {Array.from({ length: LOCK }, (_, i) => (
          <span key={i} className="rx-blink-once absolute inset-0 text-center font-digital font-black text-2xl text-[#EEF0FF]" style={d(startAt + i * 1000)}>
            {LOCK - i}
          </span>
        ))}
      </div>
    </div>
    <div
      className="rx-pop absolute inset-0 rounded-full flex items-center justify-center"
      style={{ background: accent, boxShadow: `0 0 30px ${accent}`, ...d(startAt + LOCK * 1000) }}
    >
      <Bell size={34} className="text-[#05060F]" />
    </div>
  </div>
);

const Option: React.FC<{ letter: string; text: string; state?: 'right' | 'wrong'; delay?: number }> = ({ letter, text, state, delay = 0 }) => (
  <div
    className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-[#0A0D22] text-xs sm:text-sm font-bold text-[#EEF0FF] ${
      state ? (state === 'right' ? 'rx-mark-right' : 'rx-mark-wrong') : 'border-[#262E66]'
    }`}
    style={state ? d(delay) : undefined}
  >
    <span className="w-6 h-6 rounded-lg bg-[#11163A] border border-[#262E66] flex items-center justify-center text-[#F7C873] text-xs">{letter}</span>
    <span className="truncate">{text}</span>
  </div>
);

const LetterRow: React.FC<{ letters: string; reveal?: number; highlight?: boolean }> = ({ letters, reveal, highlight }) => (
  <div className={`flex gap-1 ${highlight ? 'rx-glow-row' : ''}`}>
    {letters.split('').map((ch, i) => (
      <div key={i} className="relative w-5 h-6 sm:w-6 sm:h-7 rounded-md bg-[#0A0D22] border border-[#7CB4FF]/40 flex items-center justify-center text-[11px] sm:text-xs font-digital font-bold text-[#7CB4FF]">
        {reveal !== undefined ? (
          <span className="rx-pop" style={d(reveal + i * 90)}>{ch}</span>
        ) : null}
      </div>
    ))}
  </div>
);

// ---------- các cảnh theo vòng ----------

function khoiDongScenes(): Scene[] {
  return [
    {
      title: 'Phần thi riêng: chọn 1 trong 5 ô',
      text: <>Lần lượt từng thí sinh chọn một ô câu hỏi. Mỗi ô có <b>{KD.RIENG_QUESTIONS_PER_PLAYER} câu trắc nghiệm</b>, mỗi câu <b>{KD.RIENG_TIME_SECONDS} giây</b>.</>,
      visual: (
        <div className="flex gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`w-11 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex items-center justify-center font-heading font-black text-lg ${
                n === 3 ? 'rx-pick border-[#262E66] text-[#A6ACDB]' : 'border-[#262E66] text-[#6D75AD]'
              }`}
              style={n === 3 ? d(1500) : undefined}
            >
              {n === 3 ? (
                <span className="relative w-full h-full flex items-center justify-center">
                  <span className="rx-fade-out absolute" style={d(1500)}>?</span>
                  <span className="rx-pop absolute text-[10px] sm:text-xs text-[#F7C873] text-center leading-tight" style={d(1700)}>
                    {KD.RIENG_QUESTIONS_PER_PLAYER}
                    <br />
                    câu
                  </span>
                </span>
              ) : (
                '?'
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Chọn đáp án là chốt luôn',
      text: <>Bấm một đáp án là chốt, không đổi được. Đúng <b className="text-[#43E6B5]">+{KD.RIENG_CORRECT_POINTS} điểm</b>, sai <b>không bị trừ</b>.</>,
      visual: (
        <div className="relative grid grid-cols-2 gap-2 w-full max-w-sm">
          <Option letter="A" text="Nhà Lý" state="right" delay={1600} />
          <Option letter="B" text="Nhà Trần" />
          <Option letter="C" text="Nhà Lê" />
          <Option letter="D" text="Nhà Nguyễn" />
          <Points value={KD.RIENG_CORRECT_POINTS} delay={2300} className="-top-8 left-6" />
        </div>
      ),
    },
    {
      title: `Phần thi chung: chuông khóa ${LOCK} giây đầu`,
      text: <>{KD.CHUNG_QUESTIONS} câu hỏi cho tất cả. Chuông bị khóa <b>{LOCK} giây</b> khi câu hỏi hiện ra, sau đó ai bấm <b>nhanh nhất</b> giành quyền trả lời.</>,
      visual: (
        <div className="flex items-center gap-4 sm:gap-6">
          <BellLock accent="#F7C873" startAt={300} />
          <div className="flex flex-col gap-2">
            {[
              ['An', '#7CB4FF', 'rx-press'],
              ['Bình', '#9B7BFF', ''],
              ['Chi', '#FB923C', ''],
            ].map(([name, color, cls], i) => (
              <div key={name} className="flex items-center gap-2">
                <Avatar label={name[0]} color={color} className={cls} style={cls ? d(300 + LOCK * 1000 + 300) : undefined} />
                <span className="text-xs sm:text-sm font-bold text-[#EEF0FF] w-10">{name}</span>
                {i === 0 && (
                  <span className="rx-pop text-[10px] sm:text-xs font-heading font-black text-[#05060F] bg-[#F7C873] px-2 py-0.5 rounded-full" style={d(300 + LOCK * 1000 + 500)}>
                    GIÀNH QUYỀN
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: `Giành chuông: ${KD.CHUNG_ANSWER_SECONDS} giây để trả lời`,
      text: <>Người giành chuông có <b>{KD.CHUNG_ANSWER_SECONDS} giây</b>. Đúng <b className="text-[#43E6B5]">+{KD.CHUNG_CORRECT_POINTS}</b>, sai hoặc hết giờ <b className="text-[#FF5D8F]">{KD.CHUNG_WRONG_OR_TIMEOUT_POINTS}</b>. Không chắc thì đừng bấm!</>,
      visual: (
        <div className="flex items-center gap-6 sm:gap-10">
          <div className="relative flex flex-col items-center gap-1.5">
            <Avatar label="A" color="#7CB4FF" />
            <span className="rx-pop w-8 h-8 rounded-full bg-[#43E6B5] flex items-center justify-center" style={d(1000)}><Check size={18} className="text-[#05060F]" /></span>
            <Points value={KD.CHUNG_CORRECT_POINTS} delay={1500} className="-top-6" />
          </div>
          <div className="relative flex flex-col items-center gap-1.5">
            <Avatar label="B" color="#9B7BFF" />
            <span className="rx-pop w-8 h-8 rounded-full bg-[#FF5D8F] flex items-center justify-center" style={d(2600)}><X size={18} className="text-white" /></span>
            <Points value={KD.CHUNG_WRONG_OR_TIMEOUT_POINTS} delay={3100} className="-top-6" />
          </div>
        </div>
      ),
    },
  ];
}

function vcnvScenes(): Scene[] {
  const ladder = [1, 2, 3, 4].map((n) => VC.CNV_POINTS_BY_ROWS_DONE[n]);
  return [
    {
      title: '4 hàng ngang che giấu một từ khóa',
      text: <>Lần lượt từng người chọn một hàng ngang. Cả phòng cùng trả lời trong <b>{VC.ROW_TIME_SECONDS} giây</b>, đúng <b className="text-[#43E6B5]">+{VC.ROW_CORRECT_POINTS} điểm</b>. Có người đúng thì chữ của hàng được mở.</>,
      visual: (
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <LetterRow letters="THƯỜNG" reveal={1800} highlight />
            <LetterRow letters="MƯANGÂU" />
            <LetterRow letters="TÁNSẮC" />
            <LetterRow letters="CẦUVỒNG" />
          </div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-[10px] sm:text-xs font-heading font-bold text-[#A6ACDB] uppercase">Từ khóa</span>
            <div className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="w-5 h-6 sm:w-6 sm:h-7 rounded-md bg-[#11163A] border border-[#F7C873]/50 text-[#F7C873] text-xs font-bold flex items-center justify-center">?</div>
              ))}
            </div>
            <Points value={VC.ROW_CORRECT_POINTS} delay={2400} className="-bottom-8" />
          </div>
        </div>
      ),
    },
    {
      title: 'Đoán từ khóa sớm, điểm càng cao',
      text: <>Từ khi ô đầu tiên mở, bấm chuông <b>bất cứ lúc nào</b> để đoán từ khóa ({VC.CNV_ANSWER_SECONDS} giây). Càng ít hàng được mở, điểm càng cao.</>,
      visual: (
        <div className="flex items-end gap-2 sm:gap-3">
          {[...ladder, VC.FINAL_GUESS_CORRECT_POINTS].map((pts, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="rx-grow-bar w-10 sm:w-12 rounded-t-lg bg-gradient-to-t from-[#F7C873]/30 to-[#F7C873] flex items-start justify-center pt-1 font-digital font-black text-[#05060F] text-sm sm:text-base"
                style={{ height: `${pts * 1.4}px`, ...d(200 + i * 350) }}
              >
                {pts}
              </div>
              <span className="text-[10px] sm:text-xs text-[#A6ACDB] font-bold text-center leading-tight w-12">
                {i < 4 ? `Sau hàng ${i + 1}` : 'Ô trung tâm'}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Đoán sai: bị loại khỏi vòng này',
      text: <>Đoán sai thì <b className="text-[#FF5D8F]">không được chơi tiếp VCNV</b> (vẫn giữ điểm đã có). Nếu đang giữa câu hỏi, câu đó <b>chạy lại từ đầu</b> cho những người còn lại.</>,
      visual: (
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <Avatar label="A" color="#7CB4FF" className="rx-dim" style={d(1800)} />
            <span className="rx-shake px-2.5 py-1 rounded-lg bg-[#FF5D8F]/15 border border-[#FF5D8F]/50 text-[#FF5D8F] text-xs font-bold" style={d(900)}>"BẦU TRỜI" ✗</span>
            <span className="rx-pop text-[10px] sm:text-xs font-heading font-black text-white bg-[#FF5D8F] px-2 py-0.5 rounded-full" style={d(1800)}>BỊ LOẠI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <RotateCcw size={28} className="rx-spin-once text-[#F7C873]" style={d(2500)} />
            <span className="text-xs text-[#EEF0FF] font-bold">Câu hỏi chạy lại</span>
            <span className="rx-pop font-digital font-black text-xl text-[#F7C873]" style={d(2700)}>{VC.ROW_TIME_SECONDS}s</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Câu hỏi thứ 5 là gợi ý',
      text: <>Hết 4 hàng ngang, câu hỏi ô trung tâm hiện ra <b>{VC.CENTER_TIME_SECONDS} giây</b> làm gợi ý: <b>không cần trả lời</b>, hãy dùng nó để đoán từ khóa và bấm chuông. Sau đó còn <b>{VC.FINAL_GUESS_SECONDS} giây đoán cuối</b>. Đoán đúng lúc này <b className="text-[#43E6B5]">+{VC.FINAL_GUESS_CORRECT_POINTS}</b>.</>,
      visual: (
        <div className="relative flex flex-col items-center gap-2">
          <div className="grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-6 sm:w-20 sm:h-7 rounded-md bg-[#7CB4FF]/15 border border-[#7CB4FF]/40" />
            ))}
          </div>
          <div className="rx-pop -mt-12 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F7C873] text-[#05060F] font-heading font-black flex items-center justify-center shadow-glow-yellow" style={d(700)}>
            ★
          </div>
          <span className="rx-pop text-[10px] sm:text-xs font-heading font-black text-[#05060F] bg-[#F7C873] px-2 py-0.5 rounded-full" style={d(1500)}>
            GỢI Ý
          </span>
        </div>
      ),
    },
  ];
}

function tangTocScenes(): Scene[] {
  const rows = [
    { name: 'Chi', t: '3.21s', pts: TT.POINTS_BY_RANK[0], color: '#FB923C' },
    { name: 'An', t: '5.08s', pts: TT.POINTS_BY_RANK[1], color: '#7CB4FF' },
    { name: 'Bình', t: '9.47s', pts: TT.POINTS_BY_RANK[2], color: '#9B7BFF' },
    { name: 'Dũng', t: 'Sai', pts: 0, color: '#6D75AD' },
  ];
  return [
    {
      title: `${TT.QUESTION_COUNT} câu hỏi, ${TT.TIME_SECONDS} giây mỗi câu`,
      text: <>Cả phòng cùng trả lời một lúc. Được <b>sửa đáp án</b> cho tới khi hết giờ, đáp án cuối cùng được tính.</>,
      visual: (
        <div className="flex items-center gap-2 sm:gap-3">
          {Array.from({ length: TT.QUESTION_COUNT }, (_, i) => (
            <div key={i} className="rx-pop w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-[#7CB4FF]/60 bg-[#7CB4FF]/10 flex items-center justify-center font-heading font-black text-[#7CB4FF] text-lg" style={d(200 + i * 300)}>
              {i + 1}
            </div>
          ))}
          <div className="rx-pop ml-2 font-digital font-black text-2xl sm:text-3xl text-[#F7C873]" style={d(1600)}>{TT.TIME_SECONDS}s</div>
        </div>
      ),
    },
    {
      title: 'Đúng và nhanh nhất được nhiều điểm nhất',
      text: <>Đáp án đúng xếp theo thời gian nộp: <b>{TT.POINTS_BY_RANK.join(' / ')}</b> điểm. Nộp cách nhau dưới {TT.TIE_THRESHOLD_MS} mili giây thì đồng hạng. Sai hoặc không nộp: 0 điểm.</>,
      visual: (
        <div className="flex flex-col gap-1.5 w-full max-w-sm">
          {rows.map((r, i) => (
            <div key={r.name} className="rx-slide-in flex items-center gap-2 px-2 py-1 rounded-xl bg-[#0A0D22] border border-[#262E66]" style={d(300 + i * 450)}>
              <span className="w-5 text-center font-heading font-black text-[#A6ACDB] text-sm">{r.pts ? i + 1 : '–'}</span>
              <Avatar label={r.name[0]} color={r.color} className="!w-7 !h-7 !text-xs" />
              <span className="flex-1 text-xs sm:text-sm font-bold text-[#EEF0FF]">{r.name}</span>
              <span className="text-xs font-digital font-bold text-[#A6ACDB] w-12 text-right">{r.t}</span>
              <span className={`w-10 text-right font-digital font-black ${r.pts ? 'text-[#43E6B5]' : 'text-[#6D75AD]'}`}>{r.pts ? `+${r.pts}` : '0'}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];
}

function veDichScenes(): Scene[] {
  const packs = Object.entries(VD.PACKAGES) as [string, number[]][];
  return [
    {
      title: 'Chọn gói câu hỏi',
      text: <>Người nhiều điểm hơn đi trước. Mỗi người chọn một gói trong <b>{VD.CHOOSE_PACKAGE_SECONDS} giây</b>, gồm 3 câu, mỗi câu <b>{VD.QUESTION_TIME_BY_POINTS[10]} giây</b>. Đúng được điểm của câu, sai không bị trừ.</>,
      visual: (
        <div className="flex gap-2 sm:gap-3">
          {packs.map(([total, list], i) => (
            <div key={total} className={`rx-pop flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 ${i === 1 ? 'rx-pick border-[#262E66]' : 'border-[#262E66]'} bg-[#0A0D22]`} style={d(200 + i * 300)}>
              <span className="font-digital font-black text-2xl sm:text-3xl text-[#F7C873]">{total}</span>
              <span className="text-[10px] sm:text-xs text-[#A6ACDB] font-bold">{list.join(' · ')}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Ngôi sao hy vọng: nhân đôi hoặc mất điểm',
      text: <>Mỗi người được dùng <b>1 lần</b>, chọn trước khi câu hỏi bắt đầu. Đúng được <b className="text-[#43E6B5]">gấp đôi</b>, sai <b className="text-[#FF5D8F]">bị trừ đúng số điểm câu đó</b>.</>,
      visual: (
        <div className="flex items-center gap-5 sm:gap-8">
          <Star size={56} className="rx-pop rx-spin-once fill-[#F7C873] text-[#F7C873] drop-shadow-[0_0_14px_rgba(247,200,115,0.8)]" style={d(300)} />
          <div className="relative flex flex-col gap-2 font-digital font-black text-xl sm:text-2xl">
            <span className="rx-pop text-[#43E6B5]" style={d(1200)}>Đúng 30 × 2 = +60</span>
            <span className="rx-pop text-[#FF5D8F]" style={d(2200)}>Sai: −30</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Cướp điểm khi người chính trả lời sai',
      text: <>Chuông khóa <b>{LOCK} giây</b> rồi mở <b>{VD.STEAL_BUZZ_SECONDS} giây</b> cho người khác. Cướp đúng: được điểm câu, người chính bị trừ chừng đó. Cướp sai: <b className="text-[#FF5D8F]">trừ một nửa</b> điểm câu.</>,
      visual: (
        <div className="flex items-center gap-4 sm:gap-6">
          <BellLock accent="#FF5D8F" startAt={300} />
          <div className="relative flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Avatar label="B" color="#9B7BFF" className="rx-press" style={d(300 + LOCK * 1000 + 200)} />
              <span className="rx-pop font-digital font-black text-xl text-[#43E6B5]" style={d(300 + LOCK * 1000 + 700)}>+20</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar label="A" color="#7CB4FF" />
              <span className="rx-pop font-digital font-black text-xl text-[#FF5D8F]" style={d(300 + LOCK * 1000 + 1100)}>−20</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Bằng điểm: câu hỏi phụ',
      text: <>Người bằng điểm cao nhất thi câu hỏi phụ. Chờ tín hiệu {TB.WAIT_SIGNAL_SECONDS} giây (<b>bấm sớm mất quyền</b>), ai trả lời đúng trước <b>thắng</b>. Hết {TB.MAX_QUESTIONS} câu vẫn hòa thì bốc thăm.</>,
      visual: (
        <div className="flex items-center gap-4">
          <Avatar label="A" color="#7CB4FF" />
          <span className="font-heading font-black text-[#F7C873] text-lg">=</span>
          <Avatar label="C" color="#FB923C" />
          <ChevronRight className="text-[#6D75AD]" />
          <div className="rx-pop flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7C873]/15 border border-[#F7C873]/50 text-[#F7C873] font-heading font-black text-sm" style={d(1200)}>
            <Bell size={16} /> Ai đúng trước thắng
          </div>
        </div>
      ),
    },
  ];
}

/** Cảnh cuối chung cho mọi vòng: luật chống gian lận. */
const antiCheatScene = (): Scene => ({
  title: 'Không rời khỏi trò chơi khi đang có câu hỏi',
  text: <>{ANTI_CHEAT_RULE}</>,
  visual: (
    <div className="flex items-center gap-4">
      <ShieldAlert size={52} className="rx-pop text-[#FF5D8F]" style={d(200)} />
      <div className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold">
        <span className="rx-slide-in text-[#F7C873]" style={d(700)}>Lần 1, 2: cảnh cáo</span>
        <span className="rx-slide-in text-[#FF5D8F]" style={d(1300)}>
          Từ lần {GAME_CONFIG.ANTI_CHEAT.PENALTY_FROM_VIOLATION}: −{GAME_CONFIG.ANTI_CHEAT.PENALTY_POINTS} điểm mỗi lần
        </span>
      </div>
    </div>
  ),
});

export function scenesForRound(round: string): Scene[] {
  const base =
    round === 'VCNV' ? vcnvScenes()
    : round === 'TANG_TOC' ? tangTocScenes()
    : round === 'VE_DICH' ? veDichScenes()
    : round === 'TIEBREAK' ? veDichScenes().slice(-1)
    : khoiDongScenes();
  return GAME_CONFIG.ANTI_CHEAT.ENABLED ? [...base, antiCheatScene()] : base;
}

// ---------- khung trình chiếu ----------

export const RulesExplainer: React.FC<{ round: string; className?: string }> = ({ round, className = '' }) => {
  const scenes = useMemo(() => scenesForRound(round), [round]);
  const [rawIndex, setIndex] = useState(0);
  // Đổi sang vòng có ít cảnh hơn: chỉ số cũ có thể vượt số cảnh trước khi kịp đặt lại về 0
  const index = Math.min(rawIndex, scenes.length - 1);
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0); // tăng để chạy lại hoạt ảnh của cảnh hiện tại

  useEffect(() => {
    setIndex(0);
    setPlaying(true);
  }, [round]);

  // Tự chuyển cảnh; hết cảnh cuối thì dừng ở đó (bấm Xem lại để chạy lại từ đầu)
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (index < scenes.length - 1) setIndex(index + 1);
      else setPlaying(false);
    }, SCENE_MS);
    return () => clearTimeout(t);
  }, [index, playing, scenes.length, cycle]);

  const go = (i: number) => {
    setIndex(Math.max(0, Math.min(scenes.length - 1, i)));
    setCycle((c) => c + 1);
  };
  const replay = () => {
    setIndex(0);
    setPlaying(true);
    setCycle((c) => c + 1);
  };

  const scene = scenes[index];
  const atEnd = index === scenes.length - 1 && !playing;

  return (
    <section
      className={`w-full flex flex-col rounded-2xl bg-[#11163A] border border-[#262E66] overflow-hidden ${className}`}
      aria-roledescription="trình chiếu luật chơi"
      aria-label="Luật chơi"
    >
      {/* Thanh tiến trình kiểu story */}
      <div className="flex gap-1 px-3 pt-3">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="flex-1 h-1.5 rounded-full bg-[#262E66] overflow-hidden cursor-pointer"
            aria-label={`Cảnh ${i + 1}`}
          >
            <span
              key={`${index}-${cycle}-${i}`}
              className={`block h-full bg-[#F7C873] ${i === index && playing ? 'rx-progress' : ''}`}
              style={{
                width: i < index ? '100%' : i === index && !playing ? '100%' : i === index ? undefined : '0%',
                animationDuration: `${SCENE_MS}ms`,
              }}
            />
          </button>
        ))}
      </div>

      {/* Sân khấu: hình minh họa động */}
      <div
        key={`${index}-${cycle}`}
        className="flex-1 min-h-[150px] [@media(max-height:700px)]:min-h-[120px] flex items-center justify-center px-3 py-4 sm:py-6 overflow-hidden"
      >
        {scene.visual}
      </div>

      {/* Lời giải thích */}
      <div className="px-4 pb-3 text-left" aria-live="polite">
        <h3 key={`t-${index}-${cycle}`} className="rx-fade-up font-heading font-black text-base sm:text-lg lg:text-xl text-[#EEF0FF]">
          {scene.title}
        </h3>
        <p key={`p-${index}-${cycle}`} className="rx-fade-up mt-1 text-xs sm:text-sm lg:text-base text-[#CDD2F2] leading-relaxed" style={d(150)}>
          {scene.text}
        </p>
      </div>

      {/* Điều khiển */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <span className="text-[11px] sm:text-xs font-heading font-bold text-[#6D75AD] tabular-nums">
          {index + 1}/{scenes.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => go(index - 1)} disabled={index === 0} className="p-1.5 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[#A6ACDB] hover:text-[#EEF0FF] disabled:opacity-40" aria-label="Cảnh trước">
            <ChevronLeft size={16} />
          </button>
          {atEnd ? (
            <button onClick={replay} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[#EEF0FF] text-xs font-heading font-bold hover:border-[#F7C873]" aria-label="Xem lại từ đầu">
              <RotateCcw size={14} /> Xem lại
            </button>
          ) : (
            <button onClick={() => setPlaying((p) => !p)} className="p-1.5 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[#A6ACDB] hover:text-[#EEF0FF]" aria-label={playing ? 'Tạm dừng' : 'Tiếp tục'}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
          <button onClick={() => go(index + 1)} disabled={index === scenes.length - 1} className="p-1.5 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[#A6ACDB] hover:text-[#EEF0FF] disabled:opacity-40" aria-label="Cảnh sau">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
