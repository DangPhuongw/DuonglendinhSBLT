import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

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
  const callbacks = createMockCallbacks();
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, callbacks);
  const p2 = machine.addPlayer('Bình', 't2').player!;
  const p3 = machine.addPlayer('Chi', 't3').player!;
  const viewer = machine.addPlayer('Khán giả', 'tv').player!;
  viewer.role = 'viewer';
  const p1 = machine.room.players[0];
  return { machine, callbacks, p1, p2, p3, viewer };
}

const cfg = GAME_CONFIG.ROUND_RESULTS;
const durationFor = (n: number) =>
  cfg.START_DELAY_MS + (n - 1) * cfg.STAGGER_MS + cfg.ENTRY_MS + cfg.HOLD_MS + cfg.FADE_MS;

afterEach(() => {
  vi.useRealTimers();
});

describe('Màn công bố điểm sau mỗi vòng', () => {
  it('xếp thứ tự xuất hiện từ điểm thấp tới cao, không có khán giả, kèm điểm của vòng', () => {
    const { machine, p1, p2, p3 } = setup('RR0001');
    p1.score = 40; p1.roundScores.vcnv = 20;
    p2.score = 10; p2.roundScores.vcnv = 10;
    p3.score = 70; p3.roundScores.vcnv = 60;

    (machine as any).showRoundResults('VCNV', 'TANG_TOC');

    expect(machine.room.state.round).toBe('ROUND_RESULTS');
    const rr = machine.room.state.roundResults!;
    expect(rr.finishedRound).toBe('VCNV');
    expect(rr.entries.map((e) => e.playerId)).toEqual([p2.id, p1.id, p3.id]);
    expect(rr.entries.map((e) => e.rank)).toEqual([3, 2, 1]);
    expect(rr.entries.map((e) => e.roundScore)).toEqual([10, 20, 60]);
    machine.dispose();
  });

  it('bằng điểm thì cùng hạng; người bị loại xuất hiện đầu tiên và xếp cuối', () => {
    const { machine, p1, p2, p3 } = setup('RR0002');
    p1.score = 30;
    p2.score = 30;
    p3.score = 90; p3.disqualified = true;

    (machine as any).showRoundResults('TANG_TOC', 'VE_DICH');
    const entries = machine.room.state.roundResults!.entries;

    expect(entries[0].playerId).toBe(p3.id);
    expect(entries[0].disqualified).toBe(true);
    expect(entries[0].rank).toBe(3);
    // Bằng điểm: ghế nhỏ (p1) xuất hiện sau, cùng hạng 1
    expect(entries.slice(1).map((e) => e.playerId)).toEqual([p2.id, p1.id]);
    expect(entries.slice(1).map((e) => e.rank)).toEqual([1, 1]);
    machine.dispose();
  });

  it('hết thời gian hiệu ứng thì sang màn Sẵn sàng của vòng sau', async () => {
    vi.useFakeTimers();
    const { machine } = setup('RR0003');
    (machine as any).showRoundResults('KD_CHUNG', 'VCNV');

    const expected = durationFor(3);
    expect(machine.room.state.deadline! - Date.now()).toBe(expected);

    await vi.advanceTimersByTimeAsync(expected - 100);
    expect(machine.room.state.round).toBe('ROUND_RESULTS');

    await vi.advanceTimersByTimeAsync(GAME_CONFIG.NETWORK_GRACE_MS + 200);
    expect(machine.room.state.round).toBe('READY');
    expect(machine.room.state.targetRound).toBe('VCNV');
  });

  it('sau vòng Về đích: có người dẫn đầu thì sang bục vinh quang', async () => {
    vi.useFakeTimers();
    const { machine, p1 } = setup('RR0004');
    p1.score = 50;
    (machine as any).showRoundResults('VE_DICH', 'FINAL');

    await vi.advanceTimersByTimeAsync(durationFor(3) + GAME_CONFIG.NETWORK_GRACE_MS + 100);
    expect(machine.room.state.round).toBe('FINISHED');
    expect(machine.room.state.winnerId).toBe(p1.id);
  });

  it('kết thúc Khởi động chung thì hiện màn công bố điểm thay vì vào thẳng VCNV', async () => {
    const { machine } = setup('RR0005');
    machine.room.status = 'KD_CHUNG';
    await (machine as any).runKdChungQuestion(999);
    expect(machine.room.state.round).toBe('ROUND_RESULTS');
    expect(machine.room.state.roundResults?.nextRound).toBe('VCNV');
    machine.dispose();
  });

  it('khởi động lại server khi đang ở màn công bố điểm thì sang màn Sẵn sàng của vòng sau', () => {
    const { machine } = setup('RR0006');
    (machine as any).showRoundResults('TANG_TOC', 'VE_DICH');
    const saved = JSON.parse(JSON.stringify(machine.room));
    machine.dispose();

    const restored = new RoomStateMachine('RR0006', { id: 'p1', name: 'An', token: 't1' }, createMockCallbacks());
    restored.restoreFromSnapshot(saved);
    expect(restored.room.state.round).toBe('READY');
    expect(restored.room.state.targetRound).toBe('VE_DICH');
  });
});
