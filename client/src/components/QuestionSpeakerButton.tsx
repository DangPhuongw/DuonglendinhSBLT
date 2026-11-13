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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-heading transition-all border active:scale-95 cursor-pointer ${
        isSpeaking
          ? 'bg-[#F7C873] text-[#05060F] border-[#F7C873] shadow-glow-yellow'
          : 'bg-[#11163A] hover:bg-[#161B45] text-[#A6ACDB] hover:text-[#B9C0EA] hover:border-[#F7C873]/60 border-[#262E66]'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <Square size={13} className="fill-[#05060F] text-[#05060F]" />
          <span>Đang đọc...</span>
        </>
      ) : (
        <>
          <Volume2 size={14} className="text-[#B9C0EA]" />
          <span>Đọc câu hỏi</span>
        </>
      )}
    </button>
  );
};
