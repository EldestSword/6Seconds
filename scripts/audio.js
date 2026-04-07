const SOUND_PATTERNS = {
  intro: [440, 554, 659],
  reveal: [330, 420],
  tick: [950],
  buzzer: [130, 110],
  correct: [660, 840, 980],
  incorrect: [520, 320, 210],
  round: [420, 560],
  winner: [523, 659, 784, 988]
};

export class AudioManager {
  constructor(initialVolume = 0.7, muted = false) {
    this.volume = initialVolume;
    this.muted = muted;
    this.unlocked = false;
    this.audioContext = null;
  }

  unlock() {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        return;
      }
      this.audioContext = new Ctx();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Ignore autoplay restrictions; app should still work silently.
      });
    }

    this.unlocked = true;
  }

  setMuted(muted) {
    this.muted = muted;
  }

  setVolume(volume) {
    this.volume = Math.min(1, Math.max(0, volume));
  }

  play(name, options = {}) {
    if (this.muted || !this.unlocked || !this.audioContext) {
      return;
    }

    const pattern = SOUND_PATTERNS[name];
    if (!pattern) {
      return;
    }

    const now = this.audioContext.currentTime;
    const step = options.step ?? 0.09;
    const gainMultiplier = options.multiplier ?? 1;

    pattern.forEach((frequency, index) => {
      const start = now + index * step;
      const end = start + step;

      const oscillator = this.audioContext.createOscillator();
      oscillator.type = name === 'buzzer' ? 'sawtooth' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);

      const gain = this.audioContext.createGain();
      const level = Math.min(1, Math.max(0, this.volume * gainMultiplier));
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level), start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    });
  }

  test() {
    this.play('reveal', { multiplier: 0.9, step: 0.1 });
  }
}
