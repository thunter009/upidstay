"use client";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

export function playSendSound() {
  playTone(600, 0.15, "sine");
  setTimeout(() => playTone(800, 0.1, "sine"), 80);
}

export function playReceiveSound() {
  playTone(500, 0.12, "sine", 0.1);
}

export function playJoinSound() {
  playTone(440, 0.15, "sine", 0.1);
  setTimeout(() => playTone(554, 0.15, "sine", 0.1), 100);
  setTimeout(() => playTone(659, 0.2, "sine", 0.1), 200);
}

export function playCorrectSound() {
  playTone(523, 0.1, "sine", 0.12);
  setTimeout(() => playTone(659, 0.1, "sine", 0.12), 100);
  setTimeout(() => playTone(784, 0.2, "sine", 0.12), 200);
}

export function playWrongSound() {
  playTone(300, 0.2, "sawtooth", 0.08);
}
