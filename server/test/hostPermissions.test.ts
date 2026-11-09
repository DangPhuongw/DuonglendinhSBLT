import { describe, it, expect, vi } from 'vitest';
import {
  RoomStateMachine,
  StateMachineCallbacks,
  sanitizePlayerName,
  MAX_PLAYER_NAME_LENGTH,
} from '../src/game/RoomStateMachine.js';

function createMockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(),
    broadcastBuzzWon: vi.fn(),
    broadcastBuzzRejected: vi.fn(),
    emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(),
    broadcastScoreUpdate: vi.fn(),
    broadcastPlayerUpdate: vi.fn(),
    broadcastAntiCheat: vi.fn(),
  };
}

function setup(code: string) {
  const machine = new RoomStateMachine(
    code,
    { id: 'host', name: 'Chủ phòng', token: 'host-token' },
    createMockCallbacks()
  );
  const guest = machine.addPlayer('Khách', 'guest-token').player!;
  return { machine, guest };
}

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('Quyền chủ phòng', () => {
  it('thí sinh thường không nhảy vòng được', async () => {
    const { machine, guest } = setup('PERM01');
    expect(machine.jumpToRound(guest.id, 'VE_DICH')).toBe(false);
    await flush();
    expect(machine.room.status).toBe('LOBBY');
  });

  it('chủ phòng nhảy vòng được', async () => {
    const { machine } = setup('PERM02');
    expect(machine.jumpToRound('host', 'VE_DICH')).toBe(true);
    await flush();
    expect(machine.room.state.targetRound).toBe('VE_DICH');
  });

  it('thí sinh thường không ép bắt đầu vòng được', async () => {
    const { machine, guest } = setup('PERM03');
    machine.jumpToRound('host', 'VCNV');
    await flush();
    expect(machine.forceStartReadyRound(guest.id)).toBe(false);
    expect(machine.room.state.subPhase).toBe('WAITING_READY');
    expect(machine.forceStartReadyRound('host')).toBe(true);
    expect(machine.room.state.subPhase).toBe('COUNTDOWN');
  });

  it('isHostToken chỉ đúng với token của chủ phòng hiện tại', () => {
    const { machine } = setup('PERM04');
    expect(machine.isHostToken('host-token')).toBe(true);
    expect(machine.isHostToken('guest-token')).toBe(false);
    expect(machine.isHostToken('')).toBe(false);
    expect(machine.isHostToken(undefined)).toBe(false);
    expect(machine.isHostToken(123)).toBe(false);
  });
});

describe('Kiểm tra tên người chơi', () => {
  it('gộp khoảng trắng, bỏ ký tự điều khiển, cắt độ dài', () => {
    expect(sanitizePlayerName('  An   Bình \u0000\n')).toBe('An Bình');
    expect(sanitizePlayerName('x'.repeat(100))).toHaveLength(MAX_PLAYER_NAME_LENGTH);
    expect(sanitizePlayerName(undefined)).toBe('');
    expect(sanitizePlayerName({})).toBe('');
  });

  it('không cho vào phòng với tên rỗng', () => {
    const { machine } = setup('PERM05');
    const res = machine.addPlayer('   ', 'tok-x');
    expect(res.ok).toBe(false);
    expect(machine.room.players).toHaveLength(2);
  });
});
