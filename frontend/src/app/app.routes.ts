import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/welcome/welcome.component').then(c => c.WelcomeComponent)
  },
  {
    path: 'treino',
    loadComponent: () => import('./pages/training-dashboard/training-dashboard.component').then(c => c.TrainingDashboardComponent)
  },
  {
    path: 'comparador-intervalos',
    loadComponent: () => import('./pages/interval-comparator/interval-comparator.component').then(c => c.IntervalComparatorComponent)
  },
  {
    path: 'identificacao-intervalos',
    loadComponent: () => import('./pages/interval-identification/interval-identification.component').then(c => c.IntervalIdentificationComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
