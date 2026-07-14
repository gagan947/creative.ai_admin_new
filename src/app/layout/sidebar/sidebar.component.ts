import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  isMobileMenuOpen = false;

  links = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Users', path: '/users', icon: 'users' },
    { label: 'Projects', path: '/projects', icon: 'projects' },
    // { label: 'Builds', path: '/builds', icon: 'builds' },
    { label: 'Deploy', path: '/deploy', icon: 'deploy' },
    { label: 'Call Back Requests', path: '/callback-requests', icon: 'callback' },
    { label: 'Blog Management', path: '/blog-management', icon: 'blog' },
    { label: 'Model Management', path: '/model-management', icon: 'model' },
    { label: 'Usage & Credits', path: '/usage-credits', icon: 'credits' },
    { label: 'Subscriptions & Billing', path: '/subscriptions-billing', icon: 'billing' },
    { label: 'Errors & Failures', path: '/errors-failures', icon: 'errors' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  ngOnInit(): void {
    this.syncMenuWithViewport();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncMenuWithViewport();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  handleNavClick(): void {
    if (window.innerWidth <= 900) {
      this.isMobileMenuOpen = false;
    }
  }

  private syncMenuWithViewport(): void {
    if (window.innerWidth > 900) {
      this.isMobileMenuOpen = true;
      return;
    }

    this.isMobileMenuOpen = false;
  }
}
