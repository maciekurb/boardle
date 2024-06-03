// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { QuizComponent } from './quiz/quiz.component';
import { ResultComponent } from './result/result.component';

export const routes: Routes = [
  { path: '', component: QuizComponent },
  { path: 'result', component: ResultComponent }
];
