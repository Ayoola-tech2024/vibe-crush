// audio.js - Web Audio API Procedural Synthesizer for Vibe Crush
// With Background Cyber-Lofi Groove, SFX, Click, Announcer Chimes, and Power-Up SFX

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio not supported", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.muted;
  }

  startBGM() {
    if (this.muted || !this.ctx || this.bgmPlaying) return;
    this.resume();
    this.bgmPlaying = true;
    this.bgmStep = 0;

    const chords = [
      [220, 261.63, 329.63], // Am
      [174.61, 220, 261.63], // F
      [261.63, 329.63, 392], // C
      [196, 246.94, 293.66]  // G
    ];

    const intervalMs = 420;

    this.bgmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const chordIndex = Math.floor(this.bgmStep / 4) % chords.length;
      const chord = chords[chordIndex];

      if (this.bgmStep % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = "sine";
        bassOsc.frequency.setValueAtTime(80, t);
        bassOsc.frequency.exponentialRampToValueAtTime(32, t + 0.18);
        bassGain.gain.setValueAtTime(0.07, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + 0.18);
      }

      const noteFreq = chord[this.bgmStep % 3];
      const padOsc = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();
      padOsc.type = "sine";
      padOsc.frequency.setValueAtTime(noteFreq, t);
      padGain.gain.setValueAtTime(0.02, t);
      padGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      padOsc.connect(padGain);
      padGain.connect(this.ctx.destination);
      padOsc.start(t);
      padOsc.stop(t + 0.38);

      this.bgmStep = (this.bgmStep + 1) % 16;
    }, intervalMs);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playSwap() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playMatch(combo = 1) {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const baseFreq = 440;
    const scale = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5, 2.8, 3.2];
    const multiplier = scale[Math.min(combo - 1, scale.length - 1)];
    const freq = baseFreq * multiplier;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, t);
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.14);

    gain1.gain.setValueAtTime(0.22, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain2.gain.setValueAtTime(0.09, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.16);
    osc2.stop(t + 0.2);
  }

  // Announcer sound for "TASTY!", "SWEET!", "VIBING!"
  playAnnounce(type = "sweet") {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = type === "tasty" ? [440, 554.37, 659.25, 880] : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.22, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.18);
    });
  }

  // Power tile creation chime
  playPowerSpawn() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.22);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playLaser() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(940, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.28);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.38);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.38);

    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.linearRampToValueAtTime(80, t + 0.22);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(t);
  }

  playIceBreak() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playRainbow() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.45 }
    ];
    let offset = 0;
    melody.forEach((note) => {
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + note.d);
      offset += note.d * 0.85;
    });
  }

  playDefeat() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.5);
    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  playClick() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  playBooster() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }
}

window.audio = new AudioManager();
