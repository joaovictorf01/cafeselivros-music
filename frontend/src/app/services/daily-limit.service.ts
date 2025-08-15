import { Injectable } from '@angular/core';

export interface DailyStats {
  attempts: number;
  successes: number;
  date: string;
}

export interface ExerciseResult {
  mode: 'comparator' | 'identification';
  success: boolean;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class DailyLimitService {
  // Limite desativado temporariamente
  private readonly DAILY_LIMIT = Number.POSITIVE_INFINITY;
  private readonly STORAGE_KEY = 'musicTraining_dailyStats';
  private readonly RECENT_RESULTS_KEY = 'musicTraining_recentResults';

  constructor() {}

  getTodayStats(): DailyStats {
    const today = new Date().toDateString();
    
    // Verifica se está no browser (não SSR)
    if (typeof localStorage === 'undefined') {
      return { attempts: 0, successes: 0, date: today };
    }
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      const stats: DailyStats = JSON.parse(stored);
      if (stats.date === today) {
        return stats;
      }
    }
    
    // Return new stats for today
    return {
      attempts: 0,
      successes: 0,
      date: today
    };
  }

  recordExerciseResult(mode: 'comparator' | 'identification', success: boolean): boolean {
    const stats = this.getTodayStats();
    stats.attempts++;
    if (success) stats.successes++;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    }
    this.saveRecentResult({ mode, success, timestamp: Date.now() });
    return true; // sempre permitido
  }

  isLimitReached(): boolean {
    return false;
  }

  getRemainingAttempts(): number {
    return Infinity;
  }

  getDailyLimit(): number {
    return this.DAILY_LIMIT;
  }

  private saveRecentResult(result: ExerciseResult): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    const stored = localStorage.getItem(this.RECENT_RESULTS_KEY);
    let results: ExerciseResult[] = stored ? JSON.parse(stored) : [];
    
    results.unshift(result);
    
    // Keep only last 5 results
    if (results.length > 5) {
      results = results.slice(0, 5);
    }
    
    localStorage.setItem(this.RECENT_RESULTS_KEY, JSON.stringify(results));
  }

  getRecentResults(): ExerciseResult[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    
    const stored = localStorage.getItem(this.RECENT_RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}
