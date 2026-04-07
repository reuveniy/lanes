/**
 * Sound effects matching the original GW-BASIC SOUND commands.
 * Uses Web Audio API oscillators — no audio files needed.
 *
 * Original BASIC: SOUND freq, duration
 * Duration is in clock ticks (18.2 ticks/sec), so 1 tick ≈ 55ms, 0.5 tick ≈ 27ms
 *
 * We scale durations up slightly for clarity in a browser context.
 */

const TICK = 1 / 18.2; // seconds per BASIC clock tick
const SCALE = 1; // duration multiplier (1 = original speed)

let audioCtx: AudioContext | null = null;
let muted = false;

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
}

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, durationTicks: number, startTime: number): number {
  const ctx = getCtx();
  const dur = durationTicks * TICK * SCALE;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.value = 0.15;

  // Fade out at the end to avoid clicks
  gain.gain.setValueAtTime(0.15, startTime);
  gain.gain.linearRampToValueAtTime(0, startTime + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + dur + 0.01);

  return startTime + dur;
}

/**
 * Alarm 1: Siren (severe loss ≤-30%, traps, gold star decay)
 * 30100 FOR ALM=440 TO 1000 STEP 10: SOUND ALM,.5: NEXT ALM
 * 30250 FOR ALM=1000 TO 440 STEP -10: SOUND ALM,.5: NEXT ALM
 *
 * Use larger steps to keep total duration reasonable (~3s)
 */
export function playSiren(): void {
  if (muted) return;
  const ctx = getCtx();
  let t = ctx.currentTime;

  for (let f = 440; f <= 1000; f += 20) {
    t = playTone(f, 0.5, t);
  }
  for (let f = 1000; f >= 440; f -= 20) {
    t = playTone(f, 0.5, t);
  }
}

/**
 * Alarm 2: Short alarm (moderate loss <0%, mergers)
 * 30500 FOR ALMJ=1 TO 3: FOR ALM=300 TO 1400 STEP 100: SOUND ALM,1: NEXT ALM
 * 30550 FOR ALM=1400 TO 300 STEP -100: SOUND ALM,.5: NEXT ALM: NEXT ALMJ
 */
export function playShortAlarm(): void {
  if (muted) return;
  const ctx = getCtx();
  let t = ctx.currentTime;

  for (let j = 0; j < 3; j++) {
    for (let f = 300; f <= 1400; f += 100) {
      t = playTone(f, 1, t);
    }
    for (let f = 1400; f >= 300; f -= 100) {
      t = playTone(f, 0.5, t);
    }
  }
}

/**
 * Alarm 3: Bell (positive events, new company)
 * 31050 FOR ALM=1 TO 6: SOUND 440,.5: SOUND 880,1: SOUND 440,.5: NEXT ALM
 */
export function playBell(): void {
  if (muted) return;
  const ctx = getCtx();
  let t = ctx.currentTime;

  for (let i = 0; i < 6; i++) {
    t = playTone(440, 0.5, t);
    t = playTone(880, 1, t);
    t = playTone(440, 0.5, t);
  }
}

/**
 * BEEP (invalid input)
 * Standard BASIC BEEP = 800Hz for ~0.25s
 */
export function playBeep(): void {
  if (muted) return;
  const ctx = getCtx();
  playTone(800, 5, ctx.currentTime);
}

export type AlarmType = 1 | 2 | 3;

function ticksToMs(ticks: number): number {
  return ticks * TICK * SCALE * 1000;
}

/** Get alarm duration in milliseconds */
export function getAlarmDuration(type: AlarmType): number {
  switch (type) {
    case 1: {
      // Siren: 440→1000 step 20 (29 tones) + 1000→440 step 20 (29 tones), 0.5 ticks each
      const tones = Math.ceil((1000 - 440) / 20) + 1;
      return ticksToMs(tones * 2 * 0.5);
    }
    case 2: {
      // Short alarm: 3 loops × (300→1400 step 100 @ 1 tick + 1400→300 step 100 @ 0.5 tick)
      const up = Math.ceil((1400 - 300) / 100) + 1; // 12
      const down = up; // 12
      return ticksToMs(3 * (up * 1 + down * 0.5));
    }
    case 3: {
      // Bell: 6 × (440@0.5 + 880@1 + 440@0.5) = 6 × 2 ticks
      return ticksToMs(6 * 2);
    }
  }
}

/** Play alarm by type number, matching the original ON ALARM GOTO dispatch */
export function playAlarm(type: AlarmType): void {
  switch (type) {
    case 1:
      playSiren();
      break;
    case 2:
      playShortAlarm();
      break;
    case 3:
      playBell();
      break;
  }
}
