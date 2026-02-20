import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HealthComponent } from './components/health/health.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'health', component: HealthComponent },
  { path: 'tasks', component: TaskManagementComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
