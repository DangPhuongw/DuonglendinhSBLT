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

describe('Room & Player lifecycle', () => {
  it('creates a room with host at seat 1', () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine('ROOM01', { id: 'p1', name: 'Host Player', token: 'tok-1' }, callbacks);

    expect(machine.room.code).toBe('ROOM01');
    expect(machine.room.players.length).toBe(1);
    expect(machine.room.players[0].seat).toBe(1);
    expect(machine.room.hostId).toBe('p1');
    expect(machine.room.status).toBe('LOBBY');
  });

  it('allows players to join up to 5 seats', () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine('ROOM02', { id: 'p1', name: 'Host', token: 'tok-1' }, callbacks);

    const p2 = machine.addPlayer('Player 2', 'tok-2');
    const p3 = machine.addPlayer('Player 3', 'tok-3');
    const p4 = machine.addPlayer('Player 4', 'tok-4');
    const p5 = machine.addPlayer('Player 5', 'tok-5');

    expect(p2.ok).toBe(true);
    expect(p2.player?.seat).toBe(2);
    expect(p5.ok).toBe(true);
    expect(p5.player?.seat).toBe(5);

    // 6th player rejected
    const p6 = machine.addPlayer('Player 6', 'tok-6');
    expect(p6.ok).toBe(false);
    expect(p6.error).toContain('đủ 5 người');
  });

  it('transfers host automatically when host disconnects', () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine('ROOM03', { id: 'p1', name: 'Host', token: 'tok-1' }, callbacks);
    const p2Res = machine.addPlayer('Player 2', 'tok-2');

    machine.handleDisconnect('p1');
    expect(machine.room.players[0].connected).toBe(false);
    expect(machine.room.hostId).toBe(p2Res.player?.id);

    // Reconnecting p1 recovers state
    const recon = machine.handleReconnect('tok-1');
    expect(recon.ok).toBe(true);
    expect(recon.player?.connected).toBe(true);
  });

  it('blocks start with fewer than MIN_PLAYERS_FOR_TEST', () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine('ROOM04', { id: 'p1', name: 'Host', token: 'tok-1' }, callbacks);

    const startRes = machine.startGame('p1');
    expect(startRes.ok).toBe(false);
    expect(startRes.error).toContain('tối thiểu');
  });
});

describe('Sanitization & Security', () => {
  it('never leaks answers or alternatives in sanitized room state', () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine('ROOM05', { id: 'p1', name: 'Host', token: 'tok-1' }, callbacks);

    machine.room.state.currentQuestion = {
      id: 'q-secret',
      type: 'text',
      prompt: 'Bi mật quốc gia?',
      answer: 'SUPER_SECRET',
      alternatives: ['SECRET_ALT'],
    } as any;

    const sanitized = machine.getSanitizedRoom();
    const q: any = sanitized.state.currentQuestion;
    expect(q.prompt).toBe('Bi mật quốc gia?');
    expect(q.answer).toBeUndefined();
    expect(q.alternatives).toBeUndefined();
  });
});
