const JOIN_NOTES_HZ = [587, 784] as const;
const LEAVE_NOTES_HZ = [698, 523] as const;
const NOTE_GAP_SECONDS = 0.11;
const NOTE_DURATION_SECONDS = 0.22;
const ATTACK_SECONDS = 0.018;
const PEAK_GAIN = 0.16;
const CHIME_COOLDOWN_MS = 700;

let lastJoinPlayedAt = 0;
let lastLeavePlayedAt = 0;
let sharedContext: AudioContext | null = null;

export function unlockVoiceChimes() {
  sharedContext = sharedContext ?? new AudioContext();
  void sharedContext.resume();
}

export function playVoiceJoinChime() {
  playChime(JOIN_NOTES_HZ, "join");
}

export function playVoiceLeaveChime() {
  playChime(LEAVE_NOTES_HZ, "leave");
}

const RING_NOTES_HZ = [880, 1175] as const;
const RING_REPEAT_MS = 1800;

let ringTimer: ReturnType<typeof setInterval> | null = null;
let ringHolders = 0;

export function startVoiceRingtone() {
  ringHolders += 1;
  if (ringTimer !== null) {
    return;
  }

  playRingBurst();
  ringTimer = setInterval(playRingBurst, RING_REPEAT_MS);
}

export function stopVoiceRingtone() {
  if (ringHolders === 0) {
    return;
  }

  ringHolders -= 1;
  if (ringHolders > 0 || ringTimer === null) {
    return;
  }

  clearInterval(ringTimer);
  ringTimer = null;
}

export function forceStopVoiceRingtone() {
  ringHolders = 0;
  if (ringTimer === null) {
    return;
  }

  clearInterval(ringTimer);
  ringTimer = null;
}

function playRingBurst() {
  unlockVoiceChimes();
  const context = sharedContext;
  if (!context) {
    return;
  }

  const startedAt = context.currentTime;
  RING_NOTES_HZ.forEach((frequency, index) => {
    playNote(context, frequency, startedAt + index * NOTE_GAP_SECONDS);
  });
}

function playChime(notes: readonly number[], kind: "join" | "leave") {
  const now = Date.now();
  const lastPlayedAt = kind === "join" ? lastJoinPlayedAt : lastLeavePlayedAt;
  if (now - lastPlayedAt < CHIME_COOLDOWN_MS) {
    return;
  }
  if (kind === "join") {
    lastJoinPlayedAt = now;
  } else {
    lastLeavePlayedAt = now;
  }

  unlockVoiceChimes();
  const context = sharedContext;
  if (!context) {
    return;
  }

  const startedAt = context.currentTime;
  notes.forEach((frequency, index) => {
    playNote(context, frequency, startedAt + index * NOTE_GAP_SECONDS);
  });
}

function playNote(context: AudioContext, frequency: number, startAt: number) {
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const gain = context.createGain();
  const sparkle = context.createGain();
  oscillator.type = "sine";
  overtone.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  overtone.frequency.setValueAtTime(frequency * 2, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, startAt + ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + NOTE_DURATION_SECONDS,
  );
  sparkle.gain.setValueAtTime(0.22, startAt);
  oscillator.connect(gain);
  overtone.connect(sparkle);
  sparkle.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  overtone.start(startAt);
  oscillator.stop(startAt + NOTE_DURATION_SECONDS + 0.02);
  overtone.stop(startAt + NOTE_DURATION_SECONDS + 0.02);
}
