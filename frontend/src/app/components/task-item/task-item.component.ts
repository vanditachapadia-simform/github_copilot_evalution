import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html'
})
export class TaskItemComponent {
  @Input() task!: Task;
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() statusChange = new EventEmitter<{task: Task, status: TaskStatus}>();

  isExpanded = false;

  get statusClass(): string {
    switch (this.task.status) {
      case 'todo': return 'status-todo';
      case 'in-progress': return 'status-progress';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  get priorityClass(): string {
    switch (this.task.priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  get statusLabel(): string {
    switch (this.task.status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return this.task.status;
    }
  }

  get priorityLabel(): string {
    return this.task.priority.charAt(0).toUpperCase() + this.task.priority.slice(1);
  }

  get formattedDate(): string {
    return new Date(this.task.dueDate).toLocaleDateString();
  }

  get isOverdue(): boolean {
    const today = new Date();
    const dueDate = new Date(this.task.dueDate);
    return dueDate < today && this.task.status !== 'completed';
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task);
  }

  onStatusChange(newStatus: TaskStatus): void {
    this.statusChange.emit({ task: this.task, status: newStatus });
  }

  getAvailableStatuses(): {value: TaskStatus, label: string}[] {
    const allStatuses: {value: TaskStatus, label: string}[] = [
      { value: 'todo', label: 'To Do' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' }
    ];
    
    return allStatuses.filter(status => status.value !== this.task.status);
  }
}