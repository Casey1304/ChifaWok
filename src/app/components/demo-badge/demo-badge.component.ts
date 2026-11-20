import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-demo-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 left-4 z-40 hidden sm:block">
      <!-- Minimized pill -->
      <div
        *ngIf="isCollapsed()"
        (click)="isCollapsed.set(false)"
        class="cursor-pointer px-3 py-1.5 rounded-full bg-surface-container-highest/90 hover:bg-surface-container-high border border-outline-variant/60 shadow-md backdrop-blur-xs flex items-center gap-2 text-xs font-semibold text-on-surface transition-all"
        title="Ver opciones de demostración"
      >
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span class="text-[11px] font-bold">Modo Demo</span>
        <span class="material-symbols-outlined text-xs">tune</span>
      </div>

      <!-- Expanded Panel -->
      <div
        *ngIf="!isCollapsed()"
        class="w-72 p-3.5 rounded-2xl bg-surface/95 border border-outline-variant/50 shadow-2xl backdrop-blur-md space-y-2.5 animate-[fadeInUp_0.2s_ease-out]"
      >
        <div class="flex items-center justify-between pb-1.5 border-b border-surface-container">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="font-bold text-xs text-on-surface">Modo Demostración</span>
          </div>
          <button
            (click)="isCollapsed.set(true)"
            class="p-0.5 text-on-surface-variant hover:text-on-surface rounded-full"
          >
            <span class="material-symbols-outlined text-xs">close</span>
          </button>
        </div>

        <p class="text-[11px] text-on-surface-variant leading-tight">
          Datos persistentes en LocalStorage. Los cambios que realices se guardan en tu navegador.
        </p>

        <!-- Quick Switchers -->
        <div class="space-y-1.5 pt-1">
          <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Accesos Rápidos:</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              (click)="auth.quickSwitchRole('ADMIN')"
              class="px-2 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary hover:text-white text-primary text-[11px] font-bold transition-all text-center"
            >
              Chef / Admin
            </button>
            <button
              (click)="auth.quickSwitchRole('CLIENTE')"
              class="px-2 py-1.5 rounded-lg border border-secondary/30 bg-secondary/5 hover:bg-secondary hover:text-white text-secondary text-[11px] font-bold transition-all text-center"
            >
              Comensal
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          (click)="resetDemoData()"
          class="w-full text-center py-1 rounded-md text-[10px] text-on-surface-variant hover:text-red-600 transition-colors"
        >
          ↻ Restaurar datos originales
        </button>
      </div>
    </div>
  `
})
export class DemoBadgeComponent {
  readonly isCollapsed = signal<boolean>(true);

  constructor(
    public auth: AuthService,
    private storage: StorageService,
    private notification: NotificationService
  ) {}

  resetDemoData(): void {
    if (confirm('¿Deseas restaurar todos los productos, pedidos y clientes a los datos originales de demostración?')) {
      this.storage.resetAll();
      this.notification.info('Datos restaurados', 'Se recargarán los datos originales.');
      setTimeout(() => window.location.reload(), 400);
    }
  }
}
