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

describe('Bảo mật token (không broadcast token cho cả phòng)', () => {
  it('getSanitizedRoom và mọi broadcast không chứa token của bất kỳ ai', () => {
    const callbacks = createMockCallbacks();
    const machine = new RoomStateMachine(
      'TOKSEC',
      { id: 'host-1', name: 'Host', token: 'SECRET-HOST-TOKEN' },
      callbacks
    );
    machine.addPlayer('B', 'SECRET-B-TOKEN');
    machine.switchSeat(machine.room.players[1].id, 'viewer', 1);
    machine.handleDisconnect('host-1');

    const sanitized = JSON.stringify(machine.getSanitizedRoom());
    expect(sanitized).not.toContain('SECRET-');

    const allBroadcasts = JSON.stringify([
      (callbacks.broadcastRoom as any).mock.calls,
      (callbacks.broadcastPlayerUpdate as any).mock.calls,
    ]);
    expect((callbacks.broadcastPlayerUpdate as any).mock.calls.length).toBeGreaterThan(0);
    expect(allBroadcasts).not.toContain('SECRET-');

    // Token vẫn còn ở server để rejoin được
    expect(machine.room.players[0].token).toBe('SECRET-HOST-TOKEN');
    expect(machine.handleReconnect('SECRET-HOST-TOKEN').ok).toBe(true);
  });

  it('rejoin với token rỗng/thiếu bị từ chối', () => {
    const machine = new RoomStateMachine('TOKSE2', { id: 'h', name: 'H', token: 't' }, createMockCallbacks());
    expect(machine.handleReconnect('').ok).toBe(false);
    expect(machine.handleReconnect(undefined as any).ok).toBe(false);
  });
});
