import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AudioService, Interval } from '../../services/audio.service';
import { DailyLimitService } from '../../services/daily-limit.service';

type ComparisonAnswer = 'A' | 'B' | 'equal' | null;

@Component({
  selector: 'app-interval-comparison',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './interval-comparison.component.html',
  styleUrl: './interval-comparison.component.scss'
})
export class IntervalComparisonComponent implements OnInit {
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
  
  // Stats
  remainingAttempts = signal(0);

  constructor(
    private router: Router,
    private audioService: AudioService,
    private dailyLimitService: DailyLimitService
  ) {}

  ngOnInit() {
    this.updateRemainingAttempts();
    this.generateNewExercise();
  }

  private updateRemainingAttempts() {
    this.remainingAttempts.set(this.dailyLimitService.getRemainingAttempts());
    
    if (this.remainingAttempts() <= 0) {
      this.router.navigate(['/treino']);
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
    const recorded = this.dailyLimitService.recordExerciseResult('comparison', isCorrect);
    if (!recorded) {
      this.router.navigate(['/treino']);
      return;
    }
    
    // Update state
    this.isAnswered.set(true);
    this.showFeedback.set(true);
    
    // Set feedback message
    if (isCorrect) {
      this.feedbackMessage.set('🎉 Correto!');
    } else {
      const correctText = this.getAnswerText(this.correctAnswer());
      this.feedbackMessage.set(`❌ Incorreto. A resposta era: ${correctText}`);
    }
    
    // Update remaining attempts
    this.updateRemainingAttempts();
  }

  nextExercise() {
    if (this.remainingAttempts() <= 0) {
      this.router.navigate(['/treino']);
      return;
    }
    
    this.generateNewExercise();
  }

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
  isPlayDisabled(): boolean {
    return this.isPlaying() || this.remainingAttempts() <= 0;
  }

  isSubmitDisabled(): boolean {
    return this.selectedAnswer() === null || this.isAnswered() || this.remainingAttempts() <= 0;
  }

  canPlayNext(): boolean {
    return this.isAnswered() && this.remainingAttempts() > 0;
  }

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
      case 'enter':
        if (!this.isSubmitDisabled()) {
          event.preventDefault();
          this.submitAnswer();
        }
        break;
    }
  }
}
