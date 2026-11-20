import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PedidosService } from '../../services/pedidos.service';
import { MetricasService } from '../../services/metricas.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 bg-surface border-r border-outline-variant/40 flex flex-col justify-between h-screen shrink-0 select-none">
      <div class="flex flex-col">
        
        <!-- Logo Header -->
        <div class="h-20 px-6 flex items-center gap-3 border-b border-surface-container">
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-secondary-fixed shadow-xs">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">restaurant</span>
          </div>
          <div class="flex flex-col">
            <span class="font-headline-md text-base font-bold text-primary tracking-tight leading-none">Chifa Wok</span>
            <span class="font-label-sm text-[11px] text-on-surface-variant tracking-wider mt-1 font-semibold">Admin Consola</span>
          </div>
        </div>

        <!-- Primary Navigation -->
        <nav class="p-3 space-y-1 mt-2">
          
          <a
            routerLink="/admin/pedidos"
            routerLinkActive="text-primary font-bold bg-primary-fixed/40 border-r-4 border-primary"
            class="flex items-center justify-between px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all font-label-md text-sm"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl">receipt_long</span>
              <span>Monitor de Pedidos</span>
            </div>
            <span
              *ngIf="pedidosService.pedidosNuevos().length > 0"
              class="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black"
            >
              {{ pedidosService.pedidosNuevos().length }}
            </span>
          </a>

          <a
            routerLink="/admin/productos"
            routerLinkActive="text-primary font-bold bg-primary-fixed/40 border-r-4 border-primary"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all font-label-md text-sm"
          >
            <span class="material-symbols-outlined text-xl">restaurant_menu</span>
            <span>Gestión de Productos</span>
          </a>

          <a
            routerLink="/admin/clientes"
            routerLinkActive="text-primary font-bold bg-primary-fixed/40 border-r-4 border-primary"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all font-label-md text-sm"
          >
            <span class="material-symbols-outlined text-xl">group</span>
            <span>Clientes & CRM</span>
          </a>

          <a
            routerLink="/admin/metricas"
            routerLinkActive="text-primary font-bold bg-primary-fixed/40 border-r-4 border-primary"
            class="flex items-center justify-between px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all font-label-md text-sm"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">mic</span>
              <span>Métricas & Voice AI</span>
            </div>
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </a>

          <a
            routerLink="/admin/configuracion"
            routerLinkActive="text-primary font-bold bg-primary-fixed/40 border-r-4 border-primary"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all font-label-md text-sm"
          >
            <span class="material-symbols-outlined text-xl">settings</span>
            <span>Configuración API</span>
          </a>
        </nav>
      </div>

      <!-- Bottom Engine Status & User -->
      <div class="p-3 space-y-3">
        <!-- Vocal Wok Engine Status Box -->
        <div class="p-3 bg-surface-container-low border border-outline-variant/50 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Vocal Wok Engine</span>
            <span class="flex items-center gap-1 font-label-sm text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Activo
            </span>
          </div>
          <div class="text-xs text-on-surface-variant">
            Precisión Fonética Wok: <strong class="text-primary font-bold">98.4%</strong>
          </div>
          <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div class="bg-primary h-full rounded-full w-[98.4%]"></div>
          </div>
        </div>

        <!-- User Logout and Switch to Client -->
        <div class="pt-2 border-t border-surface-container flex items-center justify-between px-1">
          <a
            routerLink="/carta"
            class="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 font-semibold"
            title="Ver carta como cliente"
          >
            <span class="material-symbols-outlined text-sm">visibility</span>
            Ver Carta
          </a>
          <button
            (click)="auth.logout()"
            class="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
          >
            <span class="material-symbols-outlined text-sm">logout</span>
            Salir
          </button>
        </div>
      </div>
    </aside>
  `
})
export class AdminSidebarComponent {
  constructor(
    public auth: AuthService,
    public pedidosService: PedidosService,
    public metricasService: MetricasService,
    private router: Router
  ) {}
}
