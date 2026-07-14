import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { NoWhitespaceDirective } from '../../../core/validators/no-whitespace.validator';
import { UiButtonComponent, UiModalComponent, UiTableComponent } from '../../../shared/components';
import { ModelRecord, ModelsService } from '../services/models.service';

type ModelRow = Record<string, any>;

@Component({
  selector: 'app-model-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    UiButtonComponent,
    UiTableComponent,
    UiModalComponent,
  ],
  providers: [DatePipe],
  templateUrl: './model-management.component.html',
  styleUrls: ['./model-management.component.scss'],
})
export class ModelManagementComponent implements OnInit {
  readonly columns = [
    'S.No.',
    'Name',
    'Internal',
    'Default',
    'Status',
    'Created Date',
    'Action',
  ];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  rows: ModelRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;

  searchQuery = '';

  // Modal controls
  isFormModalOpen = false;
  isEditing = false;
  modalTitle = 'Add AI Model';
  modelForm!: FormGroup;

  isDeleteModalOpen = false;
  modelToDelete: ModelRecord | null = null;
  modelToEdit: ModelRecord | null = null;

  constructor(
    private readonly modelsService: ModelsService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadModels(1);
    });

    this.loadModels();
  }

  get hasRows(): boolean {
    return this.rows.length > 0;
  }

  get showingFrom(): number {
    if (!this.totalItems) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    if (!this.totalItems) {
      return 0;
    }
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  initForm(model?: ModelRecord): void {
    this.modelForm = this.fb.group({
      model_id: [model ? model.model_id : '', [Validators.required, NoWhitespaceDirective.validate]],
      name: [model ? model.name : '', [Validators.required, NoWhitespaceDirective.validate]],
      internal: [model ? model.internal : 'claude', [Validators.required]],
      is_default: [model ? model.is_default === 1 : false],
      status: [model ? model.status : 1, [Validators.required]],
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.textFilterChanges$.next();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }
    this.loadModels(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }
    this.loadModels(this.currentPage + 1);
  }

  loadModels(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.modelsService
      .getAllModels({
        page,
        limit: this.pageSize,
        search: this.searchQuery,
      })
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.rows = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.notificationService.error(response.message || 'Unable to load models.');
            this.stopLoading();
            return;
          }

          const models = response.data || [];
          this.totalItems = response.totalRecords || models.length;
          this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
          this.currentPage = page;

          this.rows = models.map((model, index) => this.mapModelRow(model, index));
          this.stopLoading();
        },
        error: (err) => {
          this.rows = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.notificationService.error(err.message || 'An error occurred while fetching models.');
          this.stopLoading();
        },
      });
  }

  private mapModelRow(model: ModelRecord, index: number): ModelRow {
    const rawAny = model as any;
    const createdDate = rawAny['created_at'] || model.createdAt || null;
    return {
      'S.No.': (this.currentPage - 1) * this.pageSize + index + 1,
      Name: model.name || 'N/A',
      Internal: model.internal || 'N/A',
      Default: model.is_default === 1,
      Status: model.status === 1 ? 'Active' : 'Inactive',
      'Created Date': createdDate ? this.formatDate(createdDate) : 'N/A',
      raw: model,
    };
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }
    return this.datePipe.transform(value, 'dd MMM yyyy') || value;
  }

  onAddModel(): void {
    this.isEditing = false;
    this.modalTitle = 'Add AI Model';
    this.modelToEdit = null;
    this.initForm();
    this.isFormModalOpen = true;
  }

  onEditModel(row: ModelRow): void {
    this.isEditing = true;
    this.modalTitle = 'Edit AI Model';
    this.modelToEdit = row['raw'] as ModelRecord;
    this.initForm(this.modelToEdit);
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.modelToEdit = null;
  }

  onSubmitForm(): void {
    this.modelForm.markAllAsTouched();
    if (this.modelForm.invalid) {
      this.notificationService.warning('Please correct the validation errors in the form.');
      return;
    }

    const formVal = this.modelForm.value;
    const payload: Omit<ModelRecord, 'id'> = {
      model_id: formVal.model_id.trim(),
      name: formVal.name.trim(),
      description: '',
      icon: '',
      tag: '',
      internal: formVal.internal,
      is_default: formVal.is_default ? 1 : 0,
      status: Number(formVal.status),
    };

    this.loading = true;

    if (this.isEditing && this.modelToEdit) {
      const updatePayload: ModelRecord = {
        ...payload,
        id: this.modelToEdit.id,
      };

      this.modelsService.updateModel(updatePayload).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.notificationService.success(res.message || 'Model updated successfully.');
            this.closeFormModal();
            this.loadModels(this.currentPage);
          } else {
            this.notificationService.warning(res.message || 'Could not update model.');
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.loading = false;
          this.notificationService.error(err.message || 'An error occurred during update.');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.modelsService.addModel(payload).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.notificationService.success(res.message || 'Model added successfully.');
            this.closeFormModal();
            this.loadModels(1); // load first page to show newly added model
          } else {
            this.notificationService.warning(res.message || 'Could not add model.');
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.loading = false;
          this.notificationService.error(err.message || 'An error occurred during create.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  onDeleteModel(row: ModelRow): void {
    this.modelToDelete = row['raw'] as ModelRecord;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.modelToDelete = null;
  }

  confirmDeleteModel(): void {
    if (!this.modelToDelete || !this.modelToDelete.id) {
      return;
    }

    const id = this.modelToDelete.id;
    this.isDeleteModalOpen = false;
    this.loading = true;

    this.modelsService.deleteModel(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.notificationService.success(res.message || 'Model deleted successfully.');
          this.loadModels(this.currentPage);
        } else {
          this.notificationService.warning(res.message || 'Could not delete model.');
          this.cdr.detectChanges();
        }
        this.modelToDelete = null;
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error(err.message || 'An error occurred during deletion.');
        this.modelToDelete = null;
        this.cdr.detectChanges();
      },
    });
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}
