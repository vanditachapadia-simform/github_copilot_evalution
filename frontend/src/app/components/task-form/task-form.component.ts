import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, CreateTaskRequest, TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() cancel = new EventEmitter<void>();

  taskForm!: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  readonly statusOptions: {value: TaskStatus, label: string}[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  readonly priorityOptions: {value: TaskPriority, label: string}[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  get isEditMode(): boolean {
    return this.task !== null;
  }

  get formTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Create New Task';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Task' : 'Create Task';
  }

  private initializeForm(): void {
    const today = new Date();
    const defaultDueDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week from today
    
    this.taskForm = this.fb.group({
      title: [
        this.task?.title || '', 
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      description: [
        this.task?.description || '', 
        [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
      ],
      status: [
        this.task?.status || 'todo', 
        [Validators.required]
      ],
      priority: [
        this.task?.priority || 'medium', 
        [Validators.required]
      ],
      dueDate: [
        this.task?.dueDate ? this.formatDateForInput(this.task.dueDate) : this.formatDateForInput(defaultDueDate.toISOString()),
        [Validators.required]
      ]
    });
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.error = null;

      const formValue = this.taskForm.value;
      const taskData: CreateTaskRequest = {
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        status: formValue.status,
        priority: formValue.priority,
        dueDate: new Date(formValue.dueDate).toISOString()
      };

      if (this.isEditMode) {
        this.updateTask(taskData);
      } else {
        this.createTask(taskData);
      }
    } else {
      this.markFormGroupTouched(this.taskForm);
    }
  }

  private createTask(taskData: CreateTaskRequest): void {
    this.taskService.createTask(taskData).subscribe({
      next: (createdTask) => {
        this.taskCreated.emit(createdTask);
        this.isSubmitting = false;
      },
      error: (error) => {
        this.error = error;
        this.isSubmitting = false;
      }
    });
  }

  private updateTask(taskData: CreateTaskRequest): void {
    this.taskService.updateTask(this.task!.id!, taskData).subscribe({
      next: (updatedTask) => {
        this.taskUpdated.emit(updatedTask);
        this.isSubmitting = false;
      },
      error: (error) => {
        this.error = error;
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required.`;
    }
    if (field.errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters.`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldLabel(fieldName)} cannot exceed ${field.errors['maxlength'].requiredLength} characters.`;
    }

    return 'Invalid input.';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: {[key: string]: string} = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      dueDate: 'Due Date'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  dismissError(): void {
    this.error = null;
  }
}