import { Injectable } from '@angular/core';

export interface Interval {
  name: string;
  semitones: number;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class AudioService {
  private audioContext: AudioContext | null = null;
  private soundfontPlayer: any = null; // piano instrument instance
  private isInitialized = false; // true after attempt (even if fallback)
  private sfLoadError: any = null;
  private masterGain: GainNode | null = null;
  private volume = 0.8; // 0..1

  readonly INTERVALS: Interval[] = [
    { name: '2M', semitones: 2, displayName: '2ª Maior' },
    { name: '3m', semitones: 3, displayName: '3ª Menor' },
    { name: '3M', semitones: 4, displayName: '3ª Maior' },
    { name: '4J', semitones: 5, displayName: '4ª Justa' },
    { name: '5J', semitones: 7, displayName: '5ª Justa' },
    { name: '8J', semitones: 12, displayName: '8ª Justa' }
  ];

  private readonly BASE_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  private readonly MIN_MIDI = 60; // C4
  private readonly MAX_MIDI = 84; // C6

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return; // SSR guard
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      if (this.audioContext.state === 'suspended') {
        // Some browsers require user gesture; resume will happen on first play
        console.log('[AudioService] Context suspended at init, will try resume later');
      }
      // Dynamic import to avoid SSR/different bundler issues
      const mod: any = await import('soundfont-player').catch(e => { this.sfLoadError = e; return null; });
      if (mod) {
        const Soundfont = mod.default || mod; // default export or namespace
        try {
          this.soundfontPlayer = await Soundfont.instrument(this.audioContext, 'acoustic_grand_piano');
          console.log('[AudioService] SoundFont piano loaded');
        } catch (e) {
          this.sfLoadError = e;
          console.error('[AudioService] Failed to load instrument, will use oscillator fallback', e);
        }
      } else {
        console.error('[AudioService] soundfont-player module failed to load');
      }
    } catch (err) {
      this.sfLoadError = err;
      console.error('[AudioService] Audio init unexpected error', err);
    } finally {
      this.isInitialized = true; // even if SoundFont missing we can fallback
    }
  }

  isUsingSoundfont(): boolean {
    return !!this.soundfontPlayer;
  }

  async playNote(note: string, duration = 0.8): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume(); } catch { }
    }
    try {
      if (this.soundfontPlayer) {
        this.soundfontPlayer.play(note, this.audioContext.currentTime, { duration, gain: 0.9 });
      } else {
        // Fallback simple oscillator beep
        await this.playOscillator(note, duration);
      }
      await this.wait(duration * 1000);
    } catch (e) {
      console.error('[AudioService] Failed to play note', e);
    }
  }

  async playSuccessSound(): Promise<void> {
    await this.playChord(['C5', 'E5', 'G5'], 0.5);
  }

  private async playChord(notes: string[], duration: number): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') { try { await this.audioContext.resume(); } catch { } }
    if (this.soundfontPlayer) {
      notes.forEach(n => this.soundfontPlayer.play(n, this.audioContext!.currentTime, { duration, gain: 0.7 }));
      await this.wait(duration * 1000);
    } else {
      // Fallback: arpeggiate quickly using oscillator
      for (const n of notes) {
        await this.playOscillator(n, duration / notes.length);
      }
    }
  }

  async playInterval(rootNote: string, interval: Interval, ascending = true, noteDelay = 0.1): Promise<void> {
    const rootMidi = this.noteToMidi(rootNote);
    const otherMidi = ascending ? rootMidi + interval.semitones : rootMidi - interval.semitones;
    if (otherMidi < this.MIN_MIDI || otherMidi > this.MAX_MIDI) return;
    const otherNote = this.midiToNote(otherMidi);
    if (ascending) {
      await this.playNote(rootNote, 0.7);
      await this.wait(noteDelay * 1000);
      await this.playNote(otherNote, 0.7);
    } else {
      await this.playNote(otherNote, 0.7);
      await this.wait(noteDelay * 1000);
      await this.playNote(rootNote, 0.7);
    }
  }

  generateRandomInterval(): Interval {
    return this.INTERVALS[Math.floor(Math.random() * this.INTERVALS.length)];
  }

  generateIntervalPair(): { intervalA: Interval; intervalB: Interval } {
    let a = this.generateRandomInterval();
    let b = this.generateRandomInterval();
    let safety = 0;
    while (b.name === a.name && safety < 10) { b = this.generateRandomInterval(); safety++; }
    return { intervalA: a, intervalB: b };
  }

  compareIntervals(a: Interval, b: Interval): 'A' | 'B' | 'equal' {
    if (a.semitones === b.semitones) return 'equal';
    return a.semitones > b.semitones ? 'A' : 'B';
  }

  generateValidRootNote(interval: Interval, ascending: boolean): string {
    const valid: string[] = [];
    for (let octave = 4; octave <= 5; octave++) {
      for (const note of this.BASE_NOTES) {
        const root = `${note}${octave}`;
        const midi = this.noteToMidi(root);
        const other = ascending ? midi + interval.semitones : midi - interval.semitones;
        if (other >= this.MIN_MIDI && other <= this.MAX_MIDI) valid.push(root);
      }
    }
    return valid[Math.floor(Math.random() * valid.length)];
  }

  private noteToMidi(note: string): number {
    const match = note.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) throw new Error('Invalid note: ' + note);
    const [, name, octStr] = match;
    const octave = parseInt(octStr, 10);
    const map: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    const val = map[name];
    if (val === undefined) throw new Error('Invalid note name: ' + name);
    return (octave + 1) * 12 + val;
  }

  private midiToNote(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return names[midi % 12] + octave;
  }

  private wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  private async playOscillator(note: string, duration: number) {
    if (!this.audioContext) return;
    const midi = this.noteToMidi(note);
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, this.audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);
    osc.connect(gain).connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration + 0.05);
  }

  // Debug helper for UI/logging if needed
  getDebugStatus() {
    return {
      initialized: this.isInitialized,
      hasContext: !!this.audioContext,
      contextState: this.audioContext?.state,
      hasSoundFont: !!this.soundfontPlayer,
      sfLoadError: this.sfLoadError
    };
  }

  getCurrentPiano(): number { return 1; }
  switchPiano(): void { /* placeholder */ }
  isAudioAvailable(): boolean { return this.isInitialized && !!this.audioContext; }
}