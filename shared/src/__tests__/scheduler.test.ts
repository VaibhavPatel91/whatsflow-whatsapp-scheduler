import { calculateJobTimes, generateIdempotencyKey } from '../schedulerLogic';

describe('Scheduler Time & Idempotency Logic', () => {
  test('calculates correct Message 2 time with 120-minute gap', () => {
    const { message1Time, message2Time } = calculateJobTimes('10:00', 120, '2026-09-03', 'Asia/Kolkata');

    expect(message1Time.toFormat('HH:mm')).toBe('10:00');
    expect(message2Time.toFormat('HH:mm')).toBe('12:00');
  });

  test('correctly handles midnight roll-over when gap exceeds 24h boundary', () => {
    const { message1Time, message2Time } = calculateJobTimes('23:30', 120, '2026-09-03', 'Asia/Kolkata');

    expect(message1Time.toFormat('yyyy-MM-dd HH:mm')).toBe('2026-09-03 23:30');
    expect(message2Time.toFormat('yyyy-MM-dd HH:mm')).toBe('2026-09-04 01:30');
  });

  test('generates unique structured idempotency key', () => {
    const key1 = generateIdempotencyKey('sched-123', '2026-09-03', 1);
    const key2 = generateIdempotencyKey('sched-123', '2026-09-03', 2);

    expect(key1).toBe('sched-123_2026-09-03_1');
    expect(key2).toBe('sched-123_2026-09-03_2');
  });
});
