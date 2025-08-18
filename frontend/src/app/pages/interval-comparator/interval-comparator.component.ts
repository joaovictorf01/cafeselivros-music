import { Component, OnInit, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnswerGridComponent, AnswerOption } from '../../shared/answer-grid/answer-grid.component';
import { AudioService, Interval } from '../../services/audio.service';
import { DailyLimitService } from '../../services/daily-limit.service';

type ComparisonAnswer = 'A' | 'B' | 'equal' | null;

@Component({
  selector: 'app-interval-comparator',
  standalone: true,
  imports: [
    MatButtonModule,
  MatIconModule,
  AnswerGridComponent
  ],
  templateUrl: './interval-comparator.component.html',
  styleUrl: './interval-comparator.component.scss'
})
export class IntervalComparatorComponent implements OnInit {
  // Exercise state
  intervalA = signal<Interval | null>(null);
  intervalB = signal<Interval | null>(null);
  rootNoteA = signal<string>('');
  rootNoteB = signal<string>('');
  selectedAnswer = signal<ComparisonAnswer>(null);
  correctAnswer = signal<ComparisonAnswer>(null);
  
  // UI state
  showFeedback = signal(false);
  isPlaying = signal(false);
  isAnswered = signal(false);
  feedbackMessage = signal('');
  

  answerOptions: AnswerOption[] = [
    { value: 'A', label: 'Par A é maior', icon: 'looks_one' },
    { value: 'B', label: 'Par B é maior', icon: 'looks_two' },
    { value: 'equal', label: 'Iguais', icon: 'drag_handle' }
  ];

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


  private generateNewExercise() {
    const { intervalA, intervalB } = this.audioService.generateIntervalPair();
    
    this.intervalA.set(intervalA);
    this.intervalB.set(intervalB);
    
    // Generate valid root notes for each interval
    this.rootNoteA.set(this.audioService.generateValidRootNote(intervalA, true));
    this.rootNoteB.set(this.audioService.generateValidRootNote(intervalB, true));
    
    // Determine correct answer
    const comparison = this.audioService.compareIntervals(intervalA, intervalB);
    this.correctAnswer.set(comparison);
    
    // Reset UI state
    this.selectedAnswer.set(null);
    this.showFeedback.set(false);
    this.isAnswered.set(false);
    this.feedbackMessage.set('');
  }

  async playPairA() {
    if (this.isPlaying() || !this.intervalA() || !this.rootNoteA()) return;
    
    this.isPlaying.set(true);
    try {
      await this.audioService.playInterval(this.rootNoteA(), this.intervalA()!, true);
    } catch (error) {
      console.error('Error playing pair A:', error);
    } finally {
      this.isPlaying.set(false);
    }
  }

  async playPairB() {
    if (this.isPlaying() || !this.intervalB() || !this.rootNoteB()) return;
    
    this.isPlaying.set(true);
    try {
      await this.audioService.playInterval(this.rootNoteB(), this.intervalB()!, true);
    } catch (error) {
      console.error('Error playing pair B:', error);
    } finally {
      this.isPlaying.set(false);
    }
  }

  async repeatBoth() {
    if (this.isPlaying()) return;
    
    await this.playPairA();
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.playPairB();
  }

  submitAnswer() {
    if (this.selectedAnswer() === null || this.isAnswered()) return;
    
    const isCorrect = this.selectedAnswer() === this.correctAnswer();
    
    // Record result
  this.dailyLimitService.recordExerciseResult('comparator', isCorrect);
    
    // Update state
    this.isAnswered.set(true);
    this.showFeedback.set(true);
    
    // Set feedback message
    if (isCorrect) {
      this.feedbackMessage.set('🎉 Correto!');
      this.audioService.playSuccessSound();
    } else {
      const correctText = this.getAnswerText(this.correctAnswer());
      this.feedbackMessage.set(`❌ Incorreto. A resposta era: ${correctText}`);
    }
    
  // Limite desativado
  }

  selectAnswer(answer: ComparisonAnswer | string) {
    // normalize
    if (answer !== 'A' && answer !== 'B' && answer !== 'equal') return;
  if (this.isAnswered()) return;
  this.selectedAnswer.set(answer);
  // Auto submit immediately
  this.submitAnswer();
  }

  nextExercise() { this.generateNewExercise(); }

  goBack() {
    this.router.navigate(['/treino']);
  }

  private getAnswerText(answer: ComparisonAnswer): string {
    switch (answer) {
      case 'A': return 'Par A é maior';
      case 'B': return 'Par B é maior';
      case 'equal': return 'Iguais';
      default: return '';
    }
  }

  // Template helper methods
  isPlayDisabled(): boolean { return this.isPlaying(); }


  canPlayNext(): boolean { return this.isAnswered(); }

  // Keyboard shortcuts
  onKeydown(event: KeyboardEvent) {
    if (this.isPlaying()) return;
    
    switch (event.key.toLowerCase()) {
      case 'r':
        event.preventDefault();
        this.repeatBoth();
        break;
      case 'n':
        if (this.canPlayNext()) {
          event.preventDefault();
          this.nextExercise();
        }
        break;
  // Enter no longer needed for submit
    }
  }
}
