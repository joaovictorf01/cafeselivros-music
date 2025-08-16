import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface AnswerOption {
  value: string;
  label: string;
  subtitle?: string; // e.g. semitons
  icon?: string;
}

@Component({
  selector: 'app-answer-grid',
  standalone: true,
  imports: [MatButtonToggleModule, NgFor, NgIf, MatIconModule],
  template: `
  <div class="answer-grid-wrapper">
    <mat-button-toggle-group
      class="answer-group"
      [disabled]="disabled"
      (change)="onChange($event)"
      [value]="value"
      appearance="legacy"
      aria-label="Opções de resposta">
      <mat-button-toggle *ngFor="let opt of options" [value]="opt.value">
        <span class="opt-inner">
          <mat-icon *ngIf="opt.icon" class="opt-icon">{{opt.icon}}</mat-icon>
          <span class="text-block">
            <span class="main">{{ opt.label }}</span>
            <span *ngIf="opt.subtitle" class="sub">{{ opt.subtitle }}</span>
          </span>
        </span>
      </mat-button-toggle>
    </mat-button-toggle-group>
  </div>
  `,
  styles: [`
    .answer-grid-wrapper { width:100%; }
    .answer-group { width:100%; display:flex; flex-wrap:wrap; gap:.5rem; }
    .answer-group .mat-button-toggle { flex:1 1 140px; text-align:left; }
    .opt-inner { display:flex; align-items:center; gap:.55rem; padding:.3rem .25rem; line-height:1.15; }
    .opt-icon { font-size:20px; width:20px; height:20px; }
    .text-block { display:flex; flex-direction:column; }
    .text-block .main { font-size:.8rem; font-weight:500; }
    .text-block .sub { font-size:.6rem; opacity:.7; letter-spacing:.5px; }
    @media (max-width:600px){
      .answer-group .mat-button-toggle { flex:1 1 100%; }
    }
  `]
})
export class AnswerGridComponent {
  @Input() options: AnswerOption[] = [];
  @Input() disabled = false;
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  @Output() answered = new EventEmitter<string>();

  onChange(e: MatButtonToggleChange) {
    this.value = e.value;
    this.valueChange.emit(e.value);
    this.answered.emit(e.value);
  }
}
