

// Synthesizer for V8 Engine Sound & FX
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Engine Oscillators
  private osc1: OscillatorNode | null = null; // Main Tone
  private osc2: OscillatorNode | null = null; // Sub/Growl
  private osc1Gain: GainNode | null = null;
  private osc2Gain: GainNode | null = null;

  // Noise (Wind/Intake)
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  // Horn Oscillators
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    // --- OSC 1: Sawtooth (The Rasp) ---
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1Gain = this.ctx.createGain();
    this.osc1.connect(this.osc1Gain);
    this.osc1Gain.connect(this.masterGain);

    // --- OSC 2: Square (The Body/Grumble) ---
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'square';
    this.osc2Gain = this.ctx.createGain();
    this.osc2.connect(this.osc2Gain);
    this.osc2Gain.connect(this.masterGain);

    // --- Noise (Air/Road) ---
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    
    // Filter noise to sound like wind/intake (Lowpass)
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 600;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    
    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    // Start Engine Sounds
    this.osc1.start();
    this.osc2.start();
    this.noiseNode.start();
  }

  update(rpm: number, load: number, speed: number, volumeMod: number = 1.0) {
    if (!this.ctx || !this.osc1 || !this.osc2) return;

    // --- DEEPER FREQUENCY CALCULATION ---
    // Lowered the divider (rpm / 24) and base (30Hz) for deeper V8 rumble
    const baseFreq = 30 + (rpm / 24); 
    
    // Osc 1 (Main)
    this.osc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    
    // Osc 2 (Sub - Detuned slightly lower for "beat" frequency)
    this.osc2.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.05);

    // Volume Mix
    // Load affects volume significantly
    const throttleFactor = 0.3 + (load * 0.7);
    
    // Gain Calculation with Volume Modifier (Drive Mode)
    const mainVol = (0.05 + (rpm / 10000)) * throttleFactor * volumeMod;
    // Boosted Sub Volume for bass
    const subVol = (0.25 + (rpm / 12000)) * throttleFactor * volumeMod;

    this.osc1Gain?.gain.setTargetAtTime(mainVol, this.ctx.currentTime, 0.1);
    this.osc2Gain?.gain.setTargetAtTime(subVol, this.ctx.currentTime, 0.1);

    // Noise (Wind noise based on speed) - Less affected by engine mode
    const speedVol = Math.min(0.4, (Math.abs(speed) / 300) * 0.5);
    this.noiseGain?.gain.setTargetAtTime(speedVol, this.ctx.currentTime, 0.5);
  }

  startHorn() {
    if (!this.ctx) this.init();
    if (!this.ctx || this.hornOsc1) return; // Already playing

    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.value = 0.4;
    this.hornGain.connect(this.ctx.destination);

    // Tone A (Low)
    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.value = 350; // F4 approx
    this.hornOsc1.connect(this.hornGain);

    // Tone B (High - dissonant interval)
    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.value = 440; // A4
    this.hornOsc2.connect(this.hornGain);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  stopHorn() {
    if (this.hornOsc1) {
        this.hornOsc1.stop();
        this.hornOsc1.disconnect();
        this.hornOsc1 = null;
    }
    if (this.hornOsc2) {
        this.hornOsc2.stop();
        this.hornOsc2.disconnect();
        this.hornOsc2 = null;
    }
    if (this.hornGain) {
        this.hornGain.disconnect();
        this.hornGain = null;
    }
  }

  playLaneDepartureBeep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  stop() {
    this.masterGain?.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.5);
  }
}

export const engineAudio = new AudioEngine();
