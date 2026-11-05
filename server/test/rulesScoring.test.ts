import { describe, it, expect, vi } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { GAME_CONFIG } from '@olympia/shared';

function createMockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(),
    broadcastPhaseChange: vi.fn(),
    broadcastBuzzWon: vi.fn(),
    broadcastBuzzRejected: vi.fn(),
    emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(),
    broadcastScoreUpdate: vi.fn(),
    broadcastPlayerUpdate: vi.fn(),
  };
}

describe('Về Đích 8 Scoring Cases & Negative Scores (G12, G13)', () => {
  it('allows negative scores and correctly executes Case 7 (Star + Stealer correct: active player only deducted once)', async () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'VEDICH',
      { id: 'p1', name: 'Main Player', token: 'tok-1' },
      callbacks
    );
    const p2Res = machine.addPlayer('Stealer Player', 'tok-2');
    const p2Id = p2Res.player!.id;

    // Set up Ve Dich active state
    machine.room.status = 'VE_DICH';
    (machine as any).veDichPlayerQueue = ['p1', p2Id];
    (machine as any).veDichCurrentQuestionPoints = 30;
    (machine as any).veDichHopeStarActive = true; // Hope star activated
    (machine as any).veDichCurrentQuestionIndex = 0;

    const testQuestion = {
      id: 'q-vd-30',
      type: 'text' as const,
      prompt: 'Câu hỏi 30 điểm?',
      answer: 'ĐÚNG',
      alternatives: [],
    };
    machine.room.state.currentQuestion = testQuestion as any;

    // Active player answers incorrectly
    (machine as any).answersMap.set('p1', { answer: 'SAI', timestamp: Date.now() });

    // Evaluate main answer -> should deduct -30 from p1 (since star was used)
    await (machine as any).evaluateVeDichMainAnswer('p1', testQuestion, [30, 30, 30], 0);

    const p1 = machine.room.players.find((p) => p.id === 'p1')!;
    expect(p1.score).toBe(-30); // Negative score allowed per G13

    // Stealer p2 buzzes and answers correctly
    await (machine as any).evaluateVeDichSteal(p2Id, 'ĐÚNG');

    const p2 = machine.room.players.find((p) => p.id === p2Id)!;
    // Stealer gets +30
    expect(p2.score).toBe(30);
    // G12: Main player with star is NOT deducted a second time! Score remains -30!
    expect(p1.score).toBe(-30);
  });

  it('correctly executes Case 8 (Star + Stealer wrong: active player -p, stealer -p/2)', async () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'VEDICH2',
      { id: 'p1', name: 'Main Player', token: 'tok-1' },
      callbacks
    );
    const p2Res = machine.addPlayer('Stealer Player', 'tok-2');
    const p2Id = p2Res.player!.id;

    machine.room.status = 'VE_DICH';
    (machine as any).veDichPlayerQueue = ['p1', p2Id];
    (machine as any).veDichCurrentQuestionPoints = 20;
    (machine as any).veDichHopeStarActive = true;
    (machine as any).veDichCurrentQuestionIndex = 0;

    const testQuestion = {
      id: 'q-vd-20',
      type: 'text' as const,
      prompt: 'Câu hỏi 20 điểm?',
      answer: 'ĐÚNG',
      alternatives: [],
    };
    machine.room.state.currentQuestion = testQuestion as any;

    // Active player wrong
    (machine as any).answersMap.set('p1', { answer: 'SAI', timestamp: Date.now() });
    await (machine as any).evaluateVeDichMainAnswer('p1', testQuestion, [20, 20, 20], 0);

    const p1 = machine.room.players.find((p) => p.id === 'p1')!;
    expect(p1.score).toBe(-20);

    // Stealer answers wrong
    await (machine as any).evaluateVeDichSteal(p2Id, 'CŨNG SAI');

    const p2 = machine.room.players.find((p) => p.id === p2Id)!;
    // Stealer loses -p/2 = -10
    expect(p2.score).toBe(-10);
    expect(p1.score).toBe(-20);
  });
});

describe('Tăng Tốc Scoring & 50ms Tiebreaker (G8)', () => {
  it('awards identical points to submissions within 50ms of each other', async () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'TANGTOC',
      { id: 'p1', name: 'Player 1', token: 'tok-1' },
      callbacks
    );
    const p2 = machine.addPlayer('Player 2', 'tok-2').player!;
    const p3 = machine.addPlayer('Player 3', 'tok-3').player!;

    machine.room.status = 'TANG_TOC';
    const testQuestion = {
      id: 'q-tt-1',
      type: 'text' as const,
      prompt: 'Câu hỏi tăng tốc?',
      answer: 'ĐÁP ÁN',
      alternatives: [],
    };

    const startTime = 100000;
    // P1 submits at +2000ms
    (machine as any).answersMap.set('p1', { answer: 'ĐÁP ÁN', timestamp: startTime + 2000 });
    // P2 submits at +2030ms (diff = 30ms <= 50ms threshold -> TIED for rank 1!)
    (machine as any).answersMap.set(p2.id, { answer: 'ĐÁP ÁN', timestamp: startTime + 2030 });
    // P3 submits at +3000ms (diff = 970ms > 50ms -> rank 3)
    (machine as any).answersMap.set(p3.id, { answer: 'ĐÁP ÁN', timestamp: startTime + 3000 });

    await (machine as any).revealTangTocQuestion(0, testQuestion, startTime);

    const player1 = machine.room.players.find((p) => p.id === 'p1')!;
    const player2 = machine.room.players.find((p) => p.id === p2.id)!;
    const player3 = machine.room.players.find((p) => p.id === p3.id)!;

    // Both p1 and p2 tied for rank 1 -> receive 30 points!
    expect(player1.score).toBe(30);
    expect(player2.score).toBe(30);
    // p3 is actual 3rd submission -> receives rank 3 points = 20 points!
    expect(player3.score).toBe(20);
  });
});

describe('VCNV Turn-based Row Selection & Letter Counts', () => {
  it('correctly sets row letter counts and allows turn-based row picking', async () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'VCNV01',
      { id: 'p1', name: 'Player 1', token: 'tok-1' },
      callbacks
    );
    const p2Res = machine.addPlayer('Player 2', 'tok-2');
    const p2 = p2Res.player!;

    // Start VCNV
    await (machine as any).startVcnv();

    expect(machine.room.status).toBe('VCNV');
    expect(machine.room.state.subPhase).toBe('PICK_ROW');
    expect(machine.room.state.activePlayerId).toBe('p1');
    expect(machine.room.state.rowLetterCounts).toBeDefined();
    expect(machine.room.state.rowLetterCounts?.length).toBe(4);

    // Player 2 cannot pick during Player 1's turn
    const p2Pick = machine.pickVcnvRow(p2.id, 0);
    expect(p2Pick).toBe(false);

    // Player 1 picks row 1 (index 1)
    const p1Pick = machine.pickVcnvRow('p1', 1);
    expect(p1Pick).toBe(true);

    // Execute event queue
    await new Promise((r) => setTimeout(r, 50));

    expect(machine.room.state.subPhase).toBe('ROW_QUESTION');
    expect(machine.room.state.activeRowIndex).toBe(1);
  });

  it('enforces VCNV scoring scale: 60 (Q1), 50 (Q2), 40 (Q3), 30 (Q4), 20 (Center/Final) and buzzer window', async () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'VCNVSC',
      { id: 'p1', name: 'Player 1', token: 'tok-1' },
      callbacks
    );
    machine.addPlayer('Player 2', 'tok-2');

    await (machine as any).startVcnv();
    expect((machine as any).vcnvQuestionsAppearedCount).toBe(0);

    // Buzzer before question 1 appeared is rejected
    const buzzBeforeQ1 = machine.handleBuzzer('p1');
    expect(buzzBeforeQ1).toBe(false);

    // Question 1 appears
    await (machine as any).presentVcnvRow(0, 0);
    expect((machine as any).vcnvQuestionsAppearedCount).toBe(1);

    // Buzz during Q1 -> correct gives 60 points
    await (machine as any).evaluateCnvGuess('p1', (machine as any).questionSet.vcnv.obstacle.answer);
    expect(machine.room.players.find((p) => p.id === 'p1')?.score).toBe(60);

    // Reset scores & test Q2 appearance -> 50 points
    machine.room.players.find((p) => p.id === 'p1')!.score = 0;
    (machine as any).vcnvQuestionsAppearedCount = 2;
    await (machine as any).evaluateCnvGuess('p1', (machine as any).questionSet.vcnv.obstacle.answer);
    expect(machine.room.players.find((p) => p.id === 'p1')?.score).toBe(50);

    // Q3 appearance -> 40 points
    machine.room.players.find((p) => p.id === 'p1')!.score = 0;
    (machine as any).vcnvQuestionsAppearedCount = 3;
    await (machine as any).evaluateCnvGuess('p1', (machine as any).questionSet.vcnv.obstacle.answer);
    expect(machine.room.players.find((p) => p.id === 'p1')?.score).toBe(40);

    // Q4 appearance -> 30 points
    machine.room.players.find((p) => p.id === 'p1')!.score = 0;
    (machine as any).vcnvQuestionsAppearedCount = 4;
    await (machine as any).evaluateCnvGuess('p1', (machine as any).questionSet.vcnv.obstacle.answer);
    expect(machine.room.players.find((p) => p.id === 'p1')?.score).toBe(30);

    // Center / Final appearance -> 20 points
    machine.room.players.find((p) => p.id === 'p1')!.score = 0;
    (machine as any).vcnvQuestionsAppearedCount = 5;
    await (machine as any).evaluateCnvGuess('p1', (machine as any).questionSet.vcnv.obstacle.answer);
    expect(machine.room.players.find((p) => p.id === 'p1')?.score).toBe(20);
  });
});
