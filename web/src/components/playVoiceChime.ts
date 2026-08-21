const JOIN_NOTES_HZ = [587, 784] as const;
const NOTE_GAP_SECONDS = 0.11;
const NOTE_DURATION_SECONDS = 0.22;
const ATTACK_SECONDS = 0.018;
const PEAK_GAIN = 0.16;
const CHIME_COOLDOWN_MS = 700;

let lastPlayedAt = 0;
let sharedContext: AudioContext | null = null;

export function unlockVoiceChimes() {
  sharedContext = sharedContext ?? new AudioContext();
  void sharedContext.resume();
}

export function playVoiceJoinChime() {
  const now = Date.now();
  if (now - lastPlayedAt < CHIME_COOLDOWN_MS) {
    return;
  }
  lastPlayedAt = now;

  unlockVoiceChimes();
  const context = sharedContext;
  if (!context) {
    return;
  }

  const startedAt = context.currentTime;
  JOIN_NOTES_HZ.forEach((frequency, index) => {
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
