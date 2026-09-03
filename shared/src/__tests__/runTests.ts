import { calculateJobTimes, generateIdempotencyKey } from '../schedulerLogic';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ ${message}`);
  }
}

console.log('----------------------------------------------------');
console.log(' Running Scheduler Engine Verification Tests');
console.log('----------------------------------------------------');

// Test 1: Standard 120-minute gap
const { message1Time, message2Time } = calculateJobTimes('10:00', 120, '2026-09-03', 'Asia/Kolkata');
assert(message1Time.toFormat('HH:mm') === '10:00', 'Message 1 time format is 10:00');
assert(message2Time.toFormat('HH:mm') === '12:00', 'Message 2 time format is 12:00 (+120 mins)');

// Test 2: Midnight Roll-over
const midnightTest = calculateJobTimes('23:30', 120, '2026-09-03', 'Asia/Kolkata');
assert(midnightTest.message1Time.toFormat('yyyy-MM-dd HH:mm') === '2026-09-03 23:30', 'Message 1 is 2026-09-03 23:30');
assert(midnightTest.message2Time.toFormat('yyyy-MM-dd HH:mm') === '2026-09-04 01:30', 'Message 2 rolls over midnight to 2026-09-04 01:30 (+120 mins)');

// Test 3: Idempotency Key Generation
const key1 = generateIdempotencyKey('sched-abc', '2026-09-03', 1);
const key2 = generateIdempotencyKey('sched-abc', '2026-09-03', 2);
assert(key1 === 'sched-abc_2026-09-03_1', 'Idempotency Key 1 matches expected format');
assert(key2 === 'sched-abc_2026-09-03_2', 'Idempotency Key 2 matches expected format');

console.log('----------------------------------------------------');
console.log(' ALL SCHEDULER ENGINE UNIT TESTS PASSED!');
console.log('----------------------------------------------------');
