import { describe, it, expect, vi } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

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

describe('Concurrency & Atomic Buzzer Lock (Milestone 7)', () => {
  it('guarantees that exactly 1 player wins the buzzer when 5 bots buzz simultaneously 100 times', async () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'CONCUR',
      { id: 'bot-1', name: 'Bot 1', token: 'tok-1' },
      callbacks
    );

    // Add 4 more bots
    machine.addPlayer('Bot 2', 'tok-2');
    machine.addPlayer('Bot 3', 'tok-3');
    machine.addPlayer('Bot 4', 'tok-4');
    machine.addPlayer('Bot 5', 'tok-5');

    const bots = machine.room.players;
    expect(bots.length).toBe(5);

    // Run 100 simultaneous buzzer races
    for (let round = 1; round <= 100; round++) {
      // Reset state for KD_CHUNG question buzz
      machine.room.status = 'KD_CHUNG';
      machine.room.state = {
        round: 'KD_CHUNG',
        subPhase: 'QUESTION_BUZZ',
        deadline: Date.now() + 15000,
        buzzerLockedBy: null,
      };

      // Reset internal buzzer locked flag on machine
      (machine as any).buzzedPlayerId = null;

      // 5 bots buzz simultaneously
      const results = await Promise.all(
        bots.map((bot) =>
          machine.eventQueue.enqueue(async () => {
            return machine.handleBuzzer(bot.id);
          })
        )
      );

      // Verify that in this iteration:
      // Exactly 1 returned true (won) and 4 returned false (locked/rejected)
      const winners = results.filter((res) => res === true);
      const losers = results.filter((res) => res === false);

      expect(winners.length).toBe(1);
      expect(losers.length).toBe(4);
      expect(machine.room.state.buzzerLockedBy).not.toBeNull();
      expect(machine.room.state.subPhase).toBe('ANSWERING');
    }
  });
});
