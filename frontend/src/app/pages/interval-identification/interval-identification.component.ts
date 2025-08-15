import { Component, OnInit, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AudioService, Interval } from '../../services/audio.service';
import { DailyLimitService } from '../../services/daily-limit.service';

@Component({
  selector: 'app-interval-identification',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './interval-identification.component.html',
  styleUrl: './interval-identification.component.scss'
})
export class IntervalIdentificationComponent implements OnInit {
  // Exercise state
  currentInterval = signal<Interval | null>(null);
  rootNote = signal<string>('');
  isAscending = signal<boolean>(true);
  options = signal<Interval[]>([]);
  selectedAnswer = signal<string | null>(null);
  
  // UI state
  showFeedback = signal(false);
  isPlaying = signal(false);
  isAnswered = signal(false);
  feedbackMessage = signal('');
  
  // Limite desativado
  remainingAttempts = signal<number | null>(null);

  constructor(
    private router: Router,
    private audioService: AudioService,
    private dailyLimitService: DailyLimitService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.generateNewExercise();
    
    // Só inicializar áudio no browser
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAudio();
    }
  }
  
  private async initializeAudio() {
    try {
      console.log('Initializing audio in browser...');
      await this.audioService.initialize();
      console.log('AudioService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private updateRemainingAttempts() { /* limite desativado */ }

  private generateNewExercise() {
    // Pick random interval
    const correctInterval = this.audioService.generateRandomInterval();
    this.currentInterval.set(correctInterval);
    
    // Pick random direction
    this.isAscending.set(Math.random() > 0.5);
    
    // Generate valid root note
    this.rootNote.set(
      this.audioService.generateValidRootNote(correctInterval, this.isAscending())
    );
    
    // Generate options (3-5 including correct answer)
    this.generateOptions(correctInterval);
    
    // Reset UI state
    this.selectedAnswer.set(null);
    this.showFeedback.set(false);
    this.isAnswered.set(false);
    this.feedbackMessage.set('');
  }

  private generateOptions(correctInterval: Interval) {
    const allIntervals = this.audioService.INTERVALS;
    const options: Interval[] = [correctInterval];
    
    // Add 2 other random intervals (total = 3)
    const targetCount = 3;
    
    while (options.length < targetCount) {
      const randomInterval = allIntervals[Math.floor(Math.random() * allIntervals.length)];
      
      // Don't add duplicates
      if (!options.find(opt => opt.name === randomInterval.name)) {
        options.push(randomInterval);
      }
    }
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    this.options.set(options);
  }

  async playInterval() {
    if (this.isPlaying() || !this.currentInterval() || !this.rootNote()) return;
    
    // Verificar se está no browser
    if (!isPlatformBrowser(this.platformId)) {
      console.log('Audio not available in SSR');
      return;
    }
    
    this.isPlaying.set(true);
    try {
      // Garantir que o áudio está inicializado
      await this.audioService.initialize();
      
      await this.audioService.playInterval(
        this.rootNote(), 
        this.currentInterval()!, 
        this.isAscending()
      );
    } catch (error) {
      console.error('Error playing interval:', error);
      alert('Erro ao reproduzir áudio. Verifique se o áudio está habilitado no seu navegador.');
    } finally {
      this.isPlaying.set(false);
    }
  }

  submitAnswer() {
    if (this.selectedAnswer() === null || this.isAnswered()) return;
    
    const isCorrect = this.selectedAnswer() === this.currentInterval()!.name;
    
    // Record result
  this.dailyLimitService.recordExerciseResult('identification', isCorrect);
    
    // Update state
    this.isAnswered.set(true);
    this.showFeedback.set(true);
    
    // Set feedback message
    if (isCorrect) {
      this.feedbackMessage.set('🎉 Correto!');
      this.audioService.playSuccessSound();
    } else {
      const correctInterval = this.currentInterval()!;
      this.feedbackMessage.set(`❌ Incorreto. A resposta era: ${correctInterval.displayName}`);
    }
    
  // Limite desativado
  }

  selectAnswer(intervalName: string) {
    if (!this.isAnswered()) {
      this.selectedAnswer.set(intervalName);
    }
  }

  nextExercise() { this.generateNewExercise(); }

  goBack() {
    this.router.navigate(['/treino']);
  }

  // Template helper methods
  isPlayDisabled(): boolean { return this.isPlaying(); }

  isSubmitDisabled(): boolean { return this.selectedAnswer() === null || this.isAnswered(); }

  canPlayNext(): boolean { return this.isAnswered(); }

  getDirectionText(): string {
    return this.isAscending() ? 'ascendente' : 'descendente';
  }

  // Keyboard shortcuts
  onKeydown(event: KeyboardEvent) {
    if (this.isPlaying()) return;
    
    switch (event.key.toLowerCase()) {
      case 'r':
        event.preventDefault();
        this.playInterval();
        break;
      case 'n':
        if (this.canPlayNext()) {
          event.preventDefault();
          this.nextExercise();
        }
        break;
      case 'enter':
        if (!this.isSubmitDisabled()) {
          event.preventDefault();
          this.submitAnswer();
        } else if (!this.isPlayDisabled()) {
          event.preventDefault();
          this.playInterval();
        }
        break;
    }
  }
}
