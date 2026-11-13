import React, { useEffect, useRef, useState } from 'react';
import { Link2, Check, QrCode, X } from 'lucide-react';

/** Link mời: mở link là tới thẳng màn "Vào phòng" với mã phòng điền sẵn. */
export function buildInviteUrl(roomCode: string): string {
  return `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Trình duyệt chặn clipboard (http, iframe...): dùng cách cũ
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Hai nút nhỏ cạnh mã phòng: sao chép link mời và hiện mã QR nhỏ. */
export const InviteLink: React.FC<{ roomCode: string }> = ({ roomCode }) => {
  const url = buildInviteUrl(roomCode);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSrc, setQrSrc] = useState('');
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    // Thư viện QR chỉ được tải khi người dùng mở ô QR lần đầu
    if (!qrOpen || qrSrc) return;
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(url, { width: 176, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#05060F', light: '#FFFFFF' } }))
      .then((src) => alive && setQrSrc(src))
      .catch(() => alive && setQrSrc(''));
    return () => {
      alive = false;
    };
  }, [url, qrOpen, qrSrc]);

  // Bấm ra ngoài hoặc Esc thì đóng QR
  useEffect(() => {
    if (!qrOpen) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setQrOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setQrOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [qrOpen]);

  const handleCopy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const btn =
    'h-9 px-2.5 rounded-xl bg-[#11163A] text-[#EEF0FF] hover:text-[#7CB4FF] border border-[#262E66] hover:border-[#7CB4FF]/60 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-heading font-bold';

  return (
    <div className="relative flex items-center gap-1.5" ref={popRef}>
      <button onClick={handleCopy} className={btn} title={`Sao chép link mời: ${url}`}>
        {copied ? <Check size={15} className="text-[#43E6B5] stroke-[3]" /> : <Link2 size={15} />}
        <span className="hidden sm:inline">{copied ? 'Đã chép link' : 'Link mời'}</span>
      </button>
      <button
        onClick={() => setQrOpen((v) => !v)}
        className={`${btn} ${qrOpen ? 'text-[#7CB4FF] border-[#7CB4FF]/60' : ''}`}
        title="Hiện mã QR để quét bằng điện thoại"
        aria-expanded={qrOpen}
      >
        <QrCode size={15} />
        <span className="hidden sm:inline">QR</span>
      </button>

      {qrOpen && (
        <div className="fixed inset-x-0 top-24 mx-auto sm:absolute sm:inset-x-auto sm:mx-0 sm:right-0 sm:top-11 z-50 w-[200px] bg-[#0A0D22] border border-[#262E66] rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.7)] rx-pop">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#A6ACDB]">Quét để vào phòng</span>
            <button onClick={() => setQrOpen(false)} className="text-[#6D75AD] hover:text-[#EEF0FF] cursor-pointer" aria-label="Đóng mã QR">
              <X size={14} />
            </button>
          </div>
          {qrSrc ? (
            <img src={qrSrc} alt={`Mã QR vào phòng ${roomCode}`} width={176} height={176} className="rounded-lg w-[176px] h-[176px]" />
          ) : (
            <div className="w-[176px] h-[176px] rounded-lg bg-[#11163A] flex items-center justify-center text-xs text-[#6D75AD]">Đang tạo mã...</div>
          )}
          <div className="mt-2 text-center font-digital font-bold tracking-widest text-[#F7C873]">{roomCode}</div>
        </div>
      )}
    </div>
  );
};
