import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DailyLimitService } from '../../services/daily-limit.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-training-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './training-dashboard.component.html',
  styleUrl: './training-dashboard.component.scss'
})
export class TrainingDashboardComponent implements OnInit {
  userName = signal('');
  attemptsToday = signal(0); // mantido apenas para estatística opcional
  successesToday = signal(0);

  constructor(
    private router: Router,
    private dailyLimitService: DailyLimitService,
    public audioService: AudioService
  ) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const savedName = localStorage.getItem('userName');
      if (savedName) {
        this.userName.set(savedName);
      } else {
        this.router.navigate(['']);
        return;
      }
    }

  this.loadDailyStats(); // opcional, não limita mais
  }

  private loadDailyStats() {
    const stats = this.dailyLimitService.getTodayStats();
    this.attemptsToday.set(stats.attempts);
    this.successesToday.set(stats.successes);
  // Limitação desativada
  }

  goToIntervalComparator() { this.router.navigate(['/comparador-intervalos']); }

  goToIntervalIdentification() { this.router.navigate(['/identificacao-intervalos']); }

  async testSound() {
    try {
      await this.audioService.playNote('C4', 0.5);
      console.log('Audio test successful');
    } catch (error) {
      console.error('Audio test failed:', error);
    }
  }

  async switchPiano() {
    try {
      await this.audioService.playNote('C4', 0.5);
      console.log('Piano switched successfully');
    } catch (error) {
      console.error('Piano switch failed:', error);
    }
  }

  getSuccessRate(): number {
    if (this.attemptsToday() === 0) return 0;
    return Math.round((this.successesToday() / this.attemptsToday()) * 100);
  }

  getRemainingAttempts(): number { return Infinity; }
}
