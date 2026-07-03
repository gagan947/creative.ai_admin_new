import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { UiButtonComponent, UiModalComponent, UiTableComponent } from '../../../../shared/components';
import { BlogRecord, BlogsService } from '../../services/blogs.service';

type BlogRow = Record<string, string | number>;

@Component({
  selector: 'app-blogs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiButtonComponent, UiTableComponent, UiModalComponent],
  providers: [DatePipe],
  templateUrl: './blogs-list.component.html',
  styleUrls: ['./blogs-list.component.scss'],
})
export class BlogsListComponent implements OnInit {
  readonly columns = ['S.No.', 'Title', 'Post Date', 'Description', 'Action'];
  readonly pageSize = 10;
  readonly textFilterChanges$ = new Subject<void>();

  rows: BlogRow[] = [];
  loading = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;
  isDeleteModalOpen = false;
  blogToDelete: BlogRow | null = null;

  searchQuery = '';

  constructor(
    private readonly blogsService: BlogsService,
    private readonly notificationService: NotificationService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.textFilterChanges$.pipe(debounceTime(350)).subscribe(() => {
      this.loadBlogs(1);
    });

    this.loadBlogs();
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

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.textFilterChanges$.next();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.loading) {
      return;
    }
    this.loadBlogs(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages || this.loading) {
      return;
    }
    this.loadBlogs(this.currentPage + 1);
  }

  onDeleteBlog(row: BlogRow): void {
    this.blogToDelete = row;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.blogToDelete = null;
  }

  confirmDeleteBlog(): void {
    if (!this.blogToDelete) {
      return;
    }
    const id = this.blogToDelete['id'];
    this.isDeleteModalOpen = false;
    this.loading = true;

    this.blogsService.deleteBlog(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success(res.message || 'Blog deleted successfully.');
          this.loading = false;
          this.loadBlogs(this.currentPage);
        } else {
          this.notificationService.warning(res.message || 'Could not delete blog.');
          this.loading = false;
          this.cdr.detectChanges();
        }
        this.blogToDelete = null;
      },
      error: (err) => {
        this.notificationService.error(err.message || 'An error occurred during deletion.');
        this.loading = false;
        this.blogToDelete = null;
        this.cdr.detectChanges();
      },
    });
  }

  onEditBlog(row: BlogRow): void {
    const id = row['id'];
    void this.router.navigate(['/blog-management/add-blog'], {
      queryParams: { id },
    });
  }

  private loadBlogs(page = this.currentPage): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.blogsService
      .getAllBlogs({
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
            this.notificationService.error(response.message || 'Unable to load blogs.');
            this.stopLoading();
            return;
          }

          const blogs = response.data || [];
          this.totalItems = response.totalRecords || blogs.length;
          this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
          this.currentPage = page;

          this.rows = blogs.map((blog, index) => this.mapBlogRow(blog, index));
          this.stopLoading();
        },
        error: (err) => {
          this.rows = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.notificationService.error(err.message || 'An error occurred while fetching blogs.');
          this.stopLoading();
        },
      });
  }

  private mapBlogRow(blog: BlogRecord, index: number): BlogRow {
    return {
      'S.No.': (this.currentPage - 1) * this.pageSize + index + 1,
      id: blog.id || '',
      Title: blog.title || 'N/A',
      'Post Date': this.formatDate(blog.post_date),
      Description: blog.description || '',
    };
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }
    return this.datePipe.transform(value, 'dd MMM yyyy') || value;
  }

  private stopLoading(): void {
    queueMicrotask(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}
