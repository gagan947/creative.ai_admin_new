import { Routes } from '@angular/router';
import { BlogsListComponent } from './components/blogs-list/blogs-list.component';
import { AddBlogComponent } from './components/add-blog/add-blog.component';

export default [
  { path: '', component: BlogsListComponent },
  { path: 'add-blog', component: AddBlogComponent },
] satisfies Routes;
