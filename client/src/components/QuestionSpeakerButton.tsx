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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
        isSpeaking
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <Square size={13} className="fill-amber-400 text-amber-400" />
          <span>Đang đọc...</span>
        </>
      ) : (
        <>
          <Volume2 size={14} className="text-amber-400" />
          <span>Đọc câu hỏi</span>
        </>
      )}
    </button>
  );
};
