import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { randomAvatarSeed } from '../utils/avatar';

const OPTION_COUNT = 10;
const makeOptions = () => Array.from({ length: OPTION_COUNT }, randomAvatarSeed);

interface Props {
  value: string;
  onChange: (seed: string) => void;
}

/** Ảnh đang chọn + một lưới ảnh ngẫu nhiên để chọn, có nút đổi bộ ảnh khác. */
export const AvatarPicker: React.FC<Props> = ({ value, onChange }) => {
  const [options, setOptions] = useState(makeOptions);

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <PlayerAvatar seed={value} size={68} className="ring-2 ring-[#FFD43B] shadow-glow-yellow bg-[#090D18]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-5 gap-1.5">
          {options.map((seed) => (
            <button
              key={seed}
              type="button"
              onClick={() => onChange(seed)}
              aria-label="Chọn ảnh đại diện này"
              className={`rounded-full p-0.5 transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                seed === value ? 'ring-2 ring-[#00D9FF]' : 'ring-1 ring-[#303D52] hover:ring-[#FFD43B]'
              }`}
            >
              <PlayerAvatar seed={seed} size={34} className="w-full h-auto" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOptions(makeOptions())}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-[#00D9FF] cursor-pointer"
        >
          <Shuffle size={13} /> Đổi bộ ảnh khác
        </button>
      </div>
    </div>
  );
};
