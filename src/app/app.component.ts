import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar.component';
import { VoiceModalComponent } from './components/voice-modal/voice-modal.component';
import { ToastComponent } from './components/toast/toast.component';
import { DemoBadgeComponent } from './components/demo-badge/demo-badge.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    VoiceModalComponent,
    ToastComponent,
    DemoBadgeComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-background text-on-surface">
      <!-- Top Navbar (hidden on /admin routes and /login /registro) -->
      <app-navbar *ngIf="showClientNavbar()"></app-navbar>

      <!-- Main Page Router Outlet -->
      <div class="flex-1">
        <router-outlet></router-outlet>
      </div>

      <!-- Global Voice Modal Mei -->
      <app-voice-modal></app-voice-modal>

      <!-- Global Floating Toast Notifications -->
      <app-toast></app-toast>

      <!-- Global Demo Mode Controls Badge -->
      <app-demo-badge></app-demo-badge>
    </div>
  `
})
export class AppComponent {
  private currentUrl = signal('');

  readonly showClientNavbar = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/admin') &&
           !url.startsWith('/login') &&
           !url.startsWith('/registro');
  });

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }
}
