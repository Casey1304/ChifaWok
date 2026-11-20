import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { VoiceAiService } from '../../services/voice-ai.service';
import { CartDrawerComponent } from '../cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, CartDrawerComponent],
  template: `
    <nav class="bg-surface border-b border-outline-variant/30 sticky top-0 z-40 shadow-xs">
      <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Brand Logo -->
        <a routerLink="/" class="flex items-center gap-2 sm:gap-3 group">
          <div class="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-secondary-fixed shadow-md group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">restaurant</span>
          </div>
          <div class="flex flex-col">
            <span class="font-display-lg text-2xl font-black text-primary tracking-tight leading-none group-hover:text-primary-container transition-colors">
              Chifa Wok
            </span>
            <span class="font-label-sm text-[10px] uppercase font-bold text-secondary tracking-widest leading-tight">
              Fusión & Tradición
            </span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="hidden md:flex items-center gap-8">
          <a
            routerLink="/"
            routerLinkActive="text-primary font-bold border-b-2 border-primary"
            [routerLinkActiveOptions]="{ exact: true }"
            class="text-on-surface-variant hover:text-primary text-sm font-semibold transition-colors py-2"
          >
            Inicio
          </a>
          <a
            routerLink="/carta"
            routerLinkActive="text-primary font-bold border-b-2 border-primary"
            class="text-on-surface-variant hover:text-primary text-sm font-semibold transition-colors py-2"
          >
            Nuestra Carta
          </a>
          <a
            routerLink="/mis-pedidos"
            routerLinkActive="text-primary font-bold border-b-2 border-primary"
            class="text-on-surface-variant hover:text-primary text-sm font-semibold transition-colors py-2"
          >
            Mis Pedidos
          </a>
          <a
            *ngIf="auth.isAdmin()"
            routerLink="/admin/pedidos"
            class="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 border border-primary/20"
          >
            <span class="material-symbols-outlined text-sm">dashboard</span>
            Panel Admin
          </a>
        </div>

        <!-- Trailing Actions -->
        <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          <!-- Voice AI Button -->
          <button
            (click)="voice.openModal()"
            title="Hablar con Mei - Asistente de Voz"
            class="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-tertiary-container to-tertiary text-on-tertiary font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all group"
          >
            <span class="material-symbols-outlined text-lg sm:text-xl group-hover:animate-pulse">mic</span>
            <span class="hidden sm:inline">Hablar con Mei</span>
            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
          </button>

          <!-- Shopping Cart Trigger Button -->
          <button
            (click)="isCartOpen.set(true)"
            title="Ver carrito de compras"
            class="relative p-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            <span class="material-symbols-outlined text-xl">shopping_cart</span>
            <span
              *ngIf="cart.totalCount() > 0"
              class="absolute -top-1 -right-1 bg-primary text-on-primary text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
            >
              {{ cart.totalCount() }}
            </span>
          </button>

          <!-- User Menu / Login -->
          <ng-container *ngIf="auth.isAuthenticated(); else loginBtn">
            <div class="relative">
              <button
                (click)="isUserMenuOpen.set(!isUserMenuOpen())"
                [attr.aria-expanded]="isUserMenuOpen()"
                aria-label="Menú de usuario"
                class="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container transition-colors"
              >
                <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-black flex items-center justify-center text-xs shadow-xs">
                  {{ auth.currentUser()?.nombre?.charAt(0) }}
                </div>
                <span class="hidden lg:inline text-xs font-bold text-on-surface">
                  {{ auth.currentUser()?.nombre }}
                </span>
                <span class="hidden sm:inline-flex"><span class="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span></span>
              </button>

              <!-- Dropdown Menu -->
              <div
                *ngIf="isUserMenuOpen()"
                (click)="isUserMenuOpen.set(false)"
                class="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-outline-variant/40 shadow-xl py-2 z-50 animate-[fadeInUp_0.2s_ease-out]"
              >
                <div class="px-4 py-2 border-b border-surface-container">
                  <p class="text-xs font-bold text-on-surface">{{ auth.currentUser()?.nombre }} {{ auth.currentUser()?.apellido }}</p>
                  <p class="text-[11px] text-on-surface-variant truncate">{{ auth.currentUser()?.email }}</p>
                  <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                    [ngClass]="auth.isAdmin() ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'"
                  >
                    Rol: {{ auth.currentUser()?.rol }}
                  </span>
                </div>

                <a
                  *ngIf="auth.isAdmin()"
                  routerLink="/admin/pedidos"
                  class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container"
                >
                  <span class="material-symbols-outlined text-sm">dashboard</span>
                  Consola Administrativa
                </a>

                <a
                  routerLink="/mis-pedidos"
                  class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container"
                >
                  <span class="material-symbols-outlined text-sm">receipt_long</span>
                  Mis Pedidos
                </a>

                <button
                  (click)="auth.logout()"
                  class="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left border-t border-surface-container mt-1"
                >
                  <span class="material-symbols-outlined text-sm">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </ng-container>

          <ng-template #loginBtn>
            <a
              routerLink="/login"
              class="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-xs"
            >
              <span class="material-symbols-outlined text-base">person</span>
              Ingresar
            </a>
          </ng-template>

          <!-- Mobile Hamburger Menu Button -->
          <button
            (click)="isMobileMenuOpen.set(!isMobileMenuOpen())"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-label="Abrir menú de navegación"
            class="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container"
          >
            <span class="material-symbols-outlined">{{ isMobileMenuOpen() ? 'close' : 'menu' }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div *ngIf="isMobileMenuOpen()" class="md:hidden border-t border-surface-container bg-surface px-4 py-4 space-y-3">
        <a
          routerLink="/"
          routerLinkActive="!text-primary font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          (click)="isMobileMenuOpen.set(false)"
          class="block py-2 text-sm font-semibold text-on-surface hover:text-primary"
        >
          Inicio
        </a>
        <a
          routerLink="/carta"
          routerLinkActive="!text-primary font-bold"
          (click)="isMobileMenuOpen.set(false)"
          class="block py-2 text-sm font-semibold text-on-surface hover:text-primary"
        >
          Nuestra Carta
        </a>
        <a
          routerLink="/mis-pedidos"
          routerLinkActive="!text-primary font-bold"
          (click)="isMobileMenuOpen.set(false)"
          class="block py-2 text-sm font-semibold text-on-surface hover:text-primary"
        >
          Mis Pedidos
        </a>
        <a
          *ngIf="auth.isAdmin()"
          routerLink="/admin/pedidos"
          (click)="isMobileMenuOpen.set(false)"
          class="block py-2 text-sm font-bold text-primary"
        >
          Panel Administrador
        </a>
        <div class="pt-3 border-t border-surface-container flex flex-col gap-2">
          <button
            (click)="voice.openModal(); isMobileMenuOpen.set(false)"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-tertiary-container text-white font-bold text-sm"
          >
            <span class="material-symbols-outlined">mic</span>
            Hablar con Mei
          </button>
          <a
            *ngIf="!auth.isAuthenticated()"
            routerLink="/login"
            (click)="isMobileMenuOpen.set(false)"
            class="w-full text-center py-2 rounded-xl border border-primary text-primary font-bold text-sm"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    </nav>

    <!-- Slide-over Cart Drawer -->
    <app-cart-drawer
      [isOpen]="isCartOpen()"
      (closeDrawer)="isCartOpen.set(false)"
    ></app-cart-drawer>
  `
})
export class NavbarComponent {
  readonly isCartOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);

  constructor(
    public auth: AuthService,
    public cart: CartService,
    public voice: VoiceAiService
  ) {}
}
