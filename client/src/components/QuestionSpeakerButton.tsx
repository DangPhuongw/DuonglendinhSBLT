import React, { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { voiceReader, QuestionLike } from '../utils/voiceReader';

interface QuestionSpeakerButtonProps {
  question?: QuestionLike | null;
  className?: string;
  autoRead?: boolean;
}

export const QuestionSpeakerButton: React.FC<QuestionSpeakerButtonProps> = ({
  question,
  className = '',
  autoRead = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(voiceReader.isSpeaking);

  useEffect(() => {
    const unsub = voiceReader.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  const qText = question?.prompt || question?.text;

  // Auto-read on new question if enabled
  useEffect(() => {
    if (autoRead && question && qText) {
      voiceReader.speakQuestion(question);
    }
  }, [qText, autoRead]);

  if (!question || !qText) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      voiceReader.stop();
    } else {
      voiceReader.speakQuestion(question, true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isSpeaking ? 'Dừng đọc (Tiếng Việt)' : 'Đọc câu hỏi (Tiếng Việt)'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 border-[#171717] shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer ${
        isSpeaking
          ? 'bg-[#FFE45C] text-[#171717] animate-pulse'
          : 'bg-white hover:bg-[#FFE45C] text-[#171717]'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <Square size={13} className="fill-[#171717] text-[#171717]" />
          <span>Đang đọc...</span>
        </>
      ) : (
        <>
          <Volume2 size={14} className="text-[#171717]" />
          <span>Đọc câu hỏi</span>
        </>
      )}
    </button>
  );
};
