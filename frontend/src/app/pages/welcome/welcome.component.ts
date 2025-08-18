import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatInputModule,
  MatFormFieldModule,
  MatIconModule,
    FormsModule
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  userName = signal('');

  constructor(private router: Router) {}

  onStart() {
    if (this.userName().trim()) {
      // Save user name to localStorage
      localStorage.setItem('userName', this.userName().trim());
      
      // Navigate to training dashboard
      this.router.navigate(['/treino']);
    }
  }

  isStartDisabled(): boolean {
    return !this.userName().trim();
  }
}
