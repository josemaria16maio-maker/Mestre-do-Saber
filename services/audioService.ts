/**
 * Audio Service
 * Uses Web Audio API for SFX to avoid external asset dependencies.
 * Uses window.speechSynthesis for the Host voice.
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private synth: SpeechSynthesis = window.speechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initAudioContext();
    this.loadVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = this.loadVoice.bind(this);
    }
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (CtxClass) {
        this.audioCtx = new CtxClass();
      }
    }
  }

  private loadVoice() {
    const voices = this.synth.getVoices();
    // Try to find a Brazilian Portuguese male voice (Google or Native)
    this.voice = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Google')) ||
                 voices.find(v => v.lang === 'pt-BR') ||
                 voices[0];
  }

  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // --- Text to Speech ---

  public speak(text: string, onEnd?: () => void) {
    this.cancelSpeech(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = 1.1; // Slightly faster for game pace
    utterance.pitch = 1.0;
    
    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synth.speak(utterance);
  }

  public cancelSpeech() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return this.synth.speaking;
  }

  // --- Sound Effects (Web Audio API) ---

  private playTone(freq: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle', duration: number, startTime: number = 0, vol: number = 0.1) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime + startTime;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public playIntro() {
    // Dramatic chord
    this.playTone(110, 'sawtooth', 2.0, 0, 0.1); // A2
    this.playTone(164.81, 'sawtooth', 2.0, 0, 0.1); // E3
    this.playTone(220, 'sawtooth', 2.0, 0, 0.1); // A3
  }

  public playSelect() {
    this.playTone(800, 'sine', 0.1, 0, 0.1);
  }

  public playConfirm() {
    // "Are you sure?" suspense sting
    this.playTone(110, 'triangle', 1.5, 0, 0.2);
  }

  public playCorrect() {
    // Happy fanfare
    this.playTone(523.25, 'square', 0.2, 0, 0.1); // C5
    this.playTone(659.25, 'square', 0.2, 0.1, 0.1); // E5
    this.playTone(783.99, 'square', 0.4, 0.2, 0.1); // G5
    this.playTone(1046.50, 'square', 0.6, 0.3, 0.15); // C6
  }

  public playWrong() {
    // Sad trombone-ish
    this.playTone(150, 'sawtooth', 0.5, 0, 0.2);
    this.playTone(142, 'sawtooth', 0.5, 0.4, 0.2);
    this.playTone(135, 'sawtooth', 1.0, 0.8, 0.2);
  }

  public playSuspense() {
    // Heartbeat low thud
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.playTone(60, 'sine', 0.1, 0, 0.3);
    this.playTone(60, 'sine', 0.1, 0.25, 0.15);
  }
}

export const audioManager = new AudioService();