import { Routes } from '@angular/router';
import { ProjectDetailComponent } from './components/project-detail.component';
import { ProjectsComponent } from './components/projects.component';

export default [
  { path: '', component: ProjectsComponent },
  { path: ':id', component: ProjectDetailComponent },
] satisfies Routes;
