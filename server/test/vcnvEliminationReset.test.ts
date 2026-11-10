import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

function setup(code: string) {
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, mockCallbacks());
  const p2 = machine.addPlayer('Bình', 't2').player!;
  const p3 = machine.addPlayer('Chi', 't3').player!;
  return { machine, p1: machine.room.players[0], p2, p3 };
}

afterEach(() => vi.useRealTimers());

describe('Trạng thái "bị loại khỏi VCNV" không kéo sang vòng sau', () => {
  it('trả lời sai chướng ngại vật thì bị loại trong VCNV, sang Tăng tốc thì hết bị loại', async () => {
    const { machine, p2 } = setup('EL0001');
    await (machine as any).startVcnv();
    await (machine as any).evaluateCnvGuess(p2.id, 'sai');
    expect(p2.eliminatedVcnv).toBe(true);

    (machine as any).showRoundResults('VCNV', 'TANG_TOC');
    expect(p2.eliminatedVcnv).toBe(false);
    machine.dispose();
  });

  it('vào vòng không phải VCNV (kể cả tua nhanh) cũng xóa trạng thái bị loại', () => {
    const { machine, p2 } = setup('EL0002');
    p2.eliminatedVcnv = true;
    (machine as any).transitionToReady('VE_DICH');
    expect(p2.eliminatedVcnv).toBe(false);
  });

  it('người bị loại vì rời tab vẫn giữ trạng thái bị loại', () => {
    const { machine, p3 } = setup('EL0003');
    p3.disqualified = true;
    p3.eliminatedVcnv = true;
    (machine as any).showRoundResults('VCNV', 'TANG_TOC');
    expect(p3.disqualified).toBe(true);
    expect(p3.eliminatedVcnv).toBe(true);
    machine.dispose();
  });

  it('bắt đầu VCNV mới vẫn đặt lại trạng thái như cũ', async () => {
    const { machine, p2 } = setup('EL0004');
    p2.eliminatedVcnv = true;
    await (machine as any).startVcnv();
    expect(p2.eliminatedVcnv).toBe(false);
    machine.dispose();
  });
});
