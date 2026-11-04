import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { voiceReader } from '../utils/voiceReader';
import { bgmManager } from '../utils/bgmManager';

export function useGameAudio() {
  const room = useGameStore((s) => s.room);
  const lastReveal = useGameStore((s) => s.lastReveal);
  const prevQuestionIdRef = useRef<string | null>(null);
  const prevSubPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!room) {
      bgmManager.stop();
      voiceReader.stop();
      return;
    }

    const round = room.state?.round;
    const subPhase = room.state?.subPhase;
    const currentQ = room.state?.currentQuestion;

    const isQuestionPhase =
      subPhase === 'QUESTION' ||
      subPhase === 'ROW_QUESTION' ||
      subPhase === 'CENTER_QUESTION' ||
      subPhase === 'QUESTION_BUZZ';

    const isRevealPhase =
      subPhase === 'REVEAL' ||
      subPhase === 'ROW_REVEAL' ||
      subPhase === 'CENTER_REVEAL';

    // 1. When a new question begins
    if (isQuestionPhase && currentQ && currentQ.id !== prevQuestionIdRef.current) {
      prevQuestionIdRef.current = currentQ.id;

      // Start BGM suspense track
      bgmManager.start();

      // Read question prompt & options if speech synthesis is enabled
      let speakText = currentQ.prompt;
      if (currentQ.options && currentQ.options.length === 4) {
        speakText += `. A: ${currentQ.options[0]}. B: ${currentQ.options[1]}. C: ${currentQ.options[2]}. D: ${currentQ.options[3]}.`;
      }
      voiceReader.speak(speakText);
    }

    // 2. When entering reveal phase
    if (isRevealPhase && prevSubPhaseRef.current !== subPhase) {
      bgmManager.stop();

      // Read correct answer
      if (lastReveal?.correctAnswer) {
        voiceReader.speak(`Đáp án chính xác là: ${lastReveal.correctAnswer}`);
      }
    }

    // 3. Stop BGM and Voice on non-question screens
    if (
      round === 'LOBBY' ||
      round === 'READY' ||
      round === 'FINISHED' ||
      subPhase === 'PICK_ROW' ||
      subPhase === 'WAITING_READY' ||
      subPhase === 'COUNTDOWN'
    ) {
      bgmManager.stop();
      voiceReader.stop();
    }

    prevSubPhaseRef.current = subPhase || null;
  }, [room?.state?.round, room?.state?.subPhase, room?.state?.currentQuestion?.id, lastReveal]);
}
