import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen pattern-bg flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      <!-- Main Card Container -->
      <div class="w-full max-w-4xl bg-surface rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-[fadeInUp_0.35s_ease-out]">
        
        <!-- LEFT: FORM COLUMN -->
        <div class="p-8 sm:p-12 flex flex-col justify-between">
          <div class="space-y-6">
            
            <!-- Brand Badge -->
            <a routerLink="/" class="inline-flex items-center gap-2 group">
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary-fixed shadow-xs">
                <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">restaurant</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="font-display-lg text-lg font-black text-primary leading-none">Chifa Wok</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                  AI Voice
                </span>
              </div>
            </a>

            <!-- Heading -->
            <div>
              <h1 class="font-display-lg text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
                ¡Bienvenido de nuevo!
              </h1>
              <p class="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Ingresa tus credenciales para gestionar tus pedidos y acceder al asistente inteligente de voz Mei.
              </p>
            </div>

            <!-- Login Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <!-- Email Input -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-on-surface">Correo Electrónico</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">mail</span>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="ejemplo@chifawok.pe"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium bg-surface focus:border-primary focus:outline-hidden transition-colors"
                    [ngClass]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched ? 'border-red-500 bg-red-50/20' : 'border-outline-variant/60'"
                  />
                </div>
                <p *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="text-[11px] text-red-600 font-semibold">
                  Ingresa un correo electrónico válido.
                </p>
              </div>

              <!-- Password Input with Show/Hide Toggle -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-on-surface">Contraseña</label>
                  <a href="javascript:void(0)" (click)="forgotPasswordNotice()" class="text-[11px] font-bold text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">lock</span>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-medium bg-surface focus:border-primary focus:outline-hidden transition-colors"
                    [ngClass]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched ? 'border-red-500 bg-red-50/20' : 'border-outline-variant/60'"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                  >
                    <span class="material-symbols-outlined text-lg">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                <p *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="text-[11px] text-red-600 font-semibold">
                  La contraseña debe tener al menos 4 caracteres.
                </p>
              </div>

              <!-- Remember me -->
              <div class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recordar"
                  formControlName="recordar"
                  class="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label for="recordar" class="text-xs text-on-surface-variant select-none">
                  Recordarme en este equipo
                </label>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="isSubmitting() || loginForm.invalid"
                class="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{{ isSubmitting() ? 'Iniciando sesión...' : 'Iniciar Sesión' }}</span>
                <span class="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>

            <!-- Quick Demo Credential Fillers -->
            <div class="pt-4 border-t border-surface-container space-y-2">
              <span class="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">
                Accesos de demostración rápidos:
              </span>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  (click)="fillDemoAdmin()"
                  class="p-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold text-left transition-colors flex flex-col"
                >
                  <span>👨‍🍳 Chef / Admin</span>
                  <span class="text-[10px] font-normal text-on-surface-variant truncate">gerencia&#64;chifawok.pe</span>
                </button>
                <button
                  type="button"
                  (click)="fillDemoCliente()"
                  class="p-2 rounded-xl border border-secondary/30 bg-secondary/5 hover:bg-secondary/10 text-secondary text-xs font-bold text-left transition-colors flex flex-col"
                >
                  <span>🥢 Comensal VIP</span>
                  <span class="text-[10px] font-normal text-on-surface-variant truncate">carlos.mendoza&#64;email.pe</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Bottom register link -->
          <div class="pt-6 mt-6 border-t border-surface-container text-center text-xs text-on-surface-variant">
            ¿No tienes una cuenta de cliente?
            <a routerLink="/registro" class="font-bold text-primary hover:underline ml-1">
              Regístrate aquí
            </a>
          </div>
        </div>

        <!-- RIGHT: BRAND EMBLEM HERO COLUMN (Matches Stitch screen) -->
        <div class="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#5F0910] via-primary to-[#3c050a] text-white relative overflow-hidden">
          
          <!-- Background decorative circles -->
          <div class="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none"></div>
          <div class="absolute -left-20 -top-20 w-60 h-60 rounded-full bg-white/5 pointer-events-none"></div>

          <!-- The Golden Emblem Logo -->
          <div class="relative z-10 w-64 h-64 p-4 drop-shadow-2xl animate-[aiPulse_4s_infinite_ease-in-out]">
            <img
              src="/chifawok_logo.svg"
              alt="Chifa Wok Emblema Dorado"
              class="w-full h-full object-contain"
            />
          </div>

          <!-- Tagline -->
          <div class="relative z-10 text-center space-y-2 mt-4 max-w-xs">
            <h3 class="font-display-lg text-xl font-black text-secondary-fixed tracking-wide">
              Andean Dragon Portal
            </h3>
            <p class="text-xs text-stone-300 leading-relaxed">
              Gestión centralizada de pedidos, cocina en tiempo real y asistencia conversacional Mei.
            </p>
          </div>

        </div>

      </div>

    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  readonly showPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['gerencia@chifawok.pe', [Validators.required, Validators.email]],
      password: ['ChifaSabor2025', [Validators.required, Validators.minLength(4)]],
      recordar: [true]
    });
  }

  fillDemoAdmin(): void {
    this.loginForm.patchValue({
      email: 'gerencia@chifawok.pe',
      password: 'ChifaSabor2025'
    });
    this.notification.info('Datos autocompletados', 'Credenciales de Administrador cargadas.');
  }

  fillDemoCliente(): void {
    this.loginForm.patchValue({
      email: 'carlos.mendoza@email.pe',
      password: '123'
    });
    this.notification.info('Datos autocompletados', 'Credenciales de Comensal cargadas.');
  }

  forgotPasswordNotice(): void {
    this.notification.info(
      'Restablecer Contraseña',
      'En modo demostración, puedes usar las credenciales rápidas de acceso.'
    );
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);

    setTimeout(() => {
      const res = this.auth.login(this.loginForm.value);
      this.isSubmitting.set(false);

      if (res.success) {
        this.notification.success('Sesión Iniciada', res.message);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.user?.rol === 'ADMIN') {
          this.router.navigate(['/admin/pedidos']);
        } else {
          this.router.navigate(['/carta']);
        }
      } else {
        this.notification.error('Error de autenticación', res.message);
      }
    }, 400);
  }
}
