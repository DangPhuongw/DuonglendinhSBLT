import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { RoomManager } from '../src/game/RoomManager.js';

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
    broadcastAntiCheat: vi.fn(),
  };
}

function setup(code: string) {
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, createMockCallbacks());
  const p2 = machine.addPlayer('Bình', 't2').player!;
  const p3 = machine.addPlayer('Chi', 't3').player!;
  const p1 = machine.room.players[0];
  return { machine, p1, p2, p3 };
}

const HOLD_MS = GAME_CONFIG.DISCONNECT_HOLD_SECONDS * 1000;
const flush = () => new Promise((r) => setTimeout(r, 20));

afterEach(() => {
  vi.useRealTimers();
});

describe('Chủ phòng mất kết nối ngắn (F5)', () => {
  it('vào lại trong thời gian chờ thì vẫn là chủ phòng', async () => {
    vi.useFakeTimers();
    const { machine, p1 } = setup('B3H001');

    machine.handleDisconnect(p1.id);
    expect(machine.room.hostId).toBe(p1.id);

    await vi.advanceTimersByTimeAsync(2000);
    machine.handleReconnect('t1');

    await vi.advanceTimersByTimeAsync(HOLD_MS + 1000);
    expect(machine.room.hostId).toBe(p1.id);
  });

  it('vắng quá thời gian chờ thì chuyển quyền cho người đang kết nối', async () => {
    vi.useFakeTimers();
    const { machine, p1, p2 } = setup('B3H002');

    machine.handleDisconnect(p1.id);
    await vi.advanceTimersByTimeAsync(HOLD_MS - 1000);
    expect(machine.room.hostId).toBe(p1.id);

    await vi.advanceTimersByTimeAsync(2000);
    expect(machine.room.hostId).toBe(p2.id);
  });

  it('khi không còn ai để nhận quyền, người vào lại đầu tiên sau thời gian chờ được làm chủ phòng', async () => {
    vi.useFakeTimers();
    const { machine, p1, p2, p3 } = setup('B3H003');

    machine.handleDisconnect(p2.id);
    machine.handleDisconnect(p3.id);
    machine.handleDisconnect(p1.id);
    await vi.advanceTimersByTimeAsync(HOLD_MS + 1000);
    expect(machine.room.hostId).toBe(p1.id);

    machine.handleReconnect('t3');
    expect(machine.room.hostId).toBe(p3.id);
  });
});

describe('Kết nối cũ của cùng người chơi', () => {
  it('vào lại bằng socket mới thì socket cũ bị gỡ, ngắt muộn không làm offline nhầm', () => {
    const rm = RoomManager.getInstance();
    expect(rm.associateSocket('sock-old', 'B3S001', 'p1')).toEqual([]);
    expect(rm.associateSocket('sock-new', 'b3s001', 'p1')).toEqual(['sock-old']);

    expect(rm.getPlayerBySocket('sock-old')).toBeUndefined();
    // Khi socket cũ ngắt muộn, removeSocket không trả về ai -> không gọi handleDisconnect
    expect(rm.removeSocket('sock-old')).toBeUndefined();
    expect(rm.getSocketByPlayer('B3S001', 'p1')).toBe('sock-new');
    rm.removeSocket('sock-new');
  });
});

describe('VCNV: người tới lượt chọn hàng vắng mặt', () => {
  it('mất kết nối lúc chọn hàng thì chuyển lượt chọn cho người khác', async () => {
    const { machine, p1 } = setup('B3V001');
    await (machine as any).startVcnv();
    expect(machine.room.state.subPhase).toBe('PICK_ROW');
    expect(machine.room.state.activePlayerId).toBe(p1.id);

    machine.handleDisconnect(p1.id);
    await flush();
    expect(machine.room.state.subPhase).toBe('PICK_ROW');
    expect(machine.room.state.activePlayerId).not.toBe(p1.id);
    expect(machine.room.state.activePlayerId).toBeTruthy();
  });

  it('chủ phòng bỏ qua người đang chọn hàng (vẫn kết nối) thì người kế tiếp được chọn', async () => {
    const { machine, p1, p2, p3 } = setup('B3V002');
    await (machine as any).startVcnv();
    await (machine as any).promptVcnvPickRow(1);
    expect(machine.room.state.activePlayerId).toBe(p2.id);

    machine.skipAbsentPlayer(p1.id, p2.id);
    await flush();
    expect(machine.room.state.subPhase).toBe('PICK_ROW');
    expect(machine.room.state.activePlayerId).toBe(p3.id);
  });
});
