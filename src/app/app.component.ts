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
      <app-demo-badge [enAdmin]="isAdminRoute()"></app-demo-badge>
    </div>
  `
})
export class AppComponent {
  // Se inicializa con la ruta real del navegador para evitar que el navbar del cliente
  // parpadee en /login o /admin antes del primer NavigationEnd (p. ej. al recargar).
  private currentUrl = signal(typeof window !== 'undefined' ? window.location.pathname : '');

  readonly isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

  readonly showClientNavbar = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/admin') &&
           !url.startsWith('/login') &&
           !url.startsWith('/registro');
  });

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }
}
