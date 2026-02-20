import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HealthComponent } from './components/health/health.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskItemComponent } from './components/task-item/task-item.component';
import { SyncStatusComponent } from './components/sync-status/sync-status.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HealthComponent,
    TaskManagementComponent,
    TaskFormComponent,
    TaskItemComponent,
    SyncStatusComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
