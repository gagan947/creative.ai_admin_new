import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';
import { NoWhitespaceDirective } from '../../../../core/validators/no-whitespace.validator';
import { UiButtonComponent } from '../../../../shared/components';
import { BlogsService } from '../../services/blogs.service';

@Component({
  selector: 'app-add-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxEditorModule, RouterModule, UiButtonComponent],
  templateUrl: './add-blog.component.html',
  styleUrls: ['./add-blog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddBlogComponent implements OnInit, OnDestroy {
  Form!: FormGroup;
  LogoImage: File | null = null;
  loading = false;
  blogId: string | null = null;
  logoPreview: string | null = null;
  editor1!: Editor;
  submited = false;
  imageUrl = environment.imageUrl;

  toolbar1: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    [{ link: { showOpenInNewTab: false } }, 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
    ['superscript', 'subscript'],
    ['undo', 'redo'],
  ];

  constructor(
    private readonly blogsService: BlogsService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    readonly location: Location,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.blogId = this.route.snapshot.queryParamMap.get('id');
    this.initForm();
    if (this.blogId) {
      this.getSingleBlog();
    }
  }

  ngOnDestroy(): void {
    if (this.editor1) {
      this.editor1.destroy();
    }
  }

  initForm(): void {
    this.editor1 = new Editor();
    this.Form = new FormGroup({
      title: new FormControl('', [Validators.required, NoWhitespaceDirective.validate]),
      slug: new FormControl('', [Validators.required, NoWhitespaceDirective.validate]),
      description: new FormControl('', [Validators.required, NoWhitespaceDirective.validate]),
      post_date: new FormControl('', [Validators.required, NoWhitespaceDirective.validate]),
      text_editor: new FormControl('', [Validators.required, NoWhitespaceDirective.validate]),
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.LogoImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeProjectImage(): void {
    this.logoPreview = null;
    this.LogoImage = null;
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.Form.invalid || !this.logoPreview) {
      this.submited = true;
      this.Form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = new FormData();

    const titleValue = this.Form.value.title ?? '';
    const slugValue = this.Form.value.slug ?? '';
    const descValue = this.Form.value.description ?? '';
    const dateValue = this.Form.value.post_date ?? '';
    const editorValue = this.Form.value.text_editor ?? '';

    formData.append('title', String(titleValue).trim());
    formData.append('slug', String(slugValue).trim());
    formData.append('description', String(descValue).trim());
    formData.append('post_date', String(dateValue));
    formData.append('text_editor', String(editorValue).trim());

    if (this.LogoImage) {
      formData.append('blog_image', this.LogoImage);
    }

    if (this.blogId) {
      formData.append('id', this.blogId.toString());
      this.blogsService.updateBlog(formData).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.notificationService.success(res.message || 'Blog updated successfully.');
            void this.router.navigate(['/blog-management'], {
              queryParams: this.route.snapshot.queryParams,
            });
          } else {
            this.notificationService.warning(res.message || 'Could not update blog.');
          }
        },
        error: (err) => {
          this.loading = false;
          this.notificationService.error(err.message || 'An error occurred during submission.');
        },
      });
    } else {
      this.blogsService.addBlog(formData).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.notificationService.success(res.message || 'Blog created successfully.');
            void this.router.navigate(['/blog-management'], {
              queryParams: this.route.snapshot.queryParams,
            });
          } else {
            this.notificationService.warning(res.message || 'Could not add blog.');
          }
        },
        error: (err) => {
          this.loading = false;
          this.notificationService.error(err.message || 'An error occurred during submission.');
        },
      });
    }
  }

  getSingleBlog(): void {
    if (!this.blogId) {
      return;
    }
    this.blogsService.getBlogById(this.blogId).subscribe({
      next: (resp) => {
        if (resp.success && resp.data && resp.data.length > 0) {
          const blog = resp.data[0];
          this.Form.patchValue({
            title: blog.title || '',
            slug: blog.slug || '',
            post_date: blog.post_date || '',
            text_editor: blog.text_editor || '',
            description: blog.description || '',
          });
          this.logoPreview = this.imageUrl + blog.banner_image;
        } else {
          this.notificationService.warning(resp.message || 'Could not fetch blog details.');
        }
      },
      error: (error) => {
        this.notificationService.error(error.message || 'An error occurred while loading blog.');
      },
    });
  }
}
