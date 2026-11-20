import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen pattern-bg flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      <div class="w-full max-w-xl bg-surface rounded-3xl shadow-2xl border border-outline-variant/40 p-8 sm:p-10 space-y-6 animate-[fadeInUp_0.35s_ease-out]">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-2">
            <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-secondary-fixed shadow-xs">
              <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">restaurant</span>
            </div>
            <span class="font-display-lg text-xl font-black text-primary">Chifa Wok</span>
          </a>
          <h1 class="font-display-lg text-2xl font-black text-on-surface">Crear Cuenta de Comensal</h1>
          <p class="text-xs text-on-surface-variant max-w-md mx-auto">
            Regístrate para acumular Puntos Dragón, guardar tus direcciones y realizar pedidos rápidos por voz con Mei.
          </p>
        </div>

        <!-- Registration Form -->
        <form [formGroup]="registroForm" (ngSubmit)="onSubmit()" class="space-y-4">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Nombre -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-on-surface">Nombre</label>
              <input
                type="text"
                formControlName="nombre"
                placeholder="Carlos"
                class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
              />
            </div>

            <!-- Apellido -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-on-surface">Apellido</label>
              <input
                type="text"
                formControlName="apellido"
                placeholder="Mendoza"
                class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-on-surface">Correo Electrónico</label>
            <input
              type="email"
              formControlName="email"
              placeholder="carlos.mendoza@email.pe"
              class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Telefono -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-on-surface">Teléfono Celular</label>
              <input
                type="tel"
                formControlName="telefono"
                placeholder="+51 987 654 321"
                class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
              />
            </div>

            <!-- Distrito -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-on-surface">Distrito (Lima)</label>
              <select
                formControlName="distrito"
                class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
              >
                <option value="Miraflores">Miraflores</option>
                <option value="San Isidro">San Isidro</option>
                <option value="Surco">Santiago de Surco</option>
                <option value="San Borja">San Borja</option>
                <option value="Magdalena">Magdalena del Mar</option>
                <option value="Barranco">Barranco</option>
                <option value="Jesus Maria">Jesús María</option>
                <option value="Lince">Lince</option>
                <option value="La Molina">La Molina</option>
              </select>
            </div>
          </div>

          <!-- Dirección -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-on-surface">Dirección de Entrega Habitual</label>
            <input
              type="text"
              formControlName="direccion"
              placeholder="Av. Pardo 450, Dpto 602"
              class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-on-surface">Contraseña</label>
            <input
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs sm:text-sm bg-surface"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isSubmitting() || registroForm.invalid"
            class="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{{ isSubmitting() ? 'Registrando...' : 'Completar Registro' }}</span>
            <span class="material-symbols-outlined text-lg">check_circle</span>
          </button>
        </form>

        <div class="pt-4 border-t border-surface-container text-center text-xs text-on-surface-variant">
          ¿Ya tienes una cuenta?
          <a routerLink="/login" class="font-bold text-primary hover:underline ml-1">
            Inicia sesión
          </a>
        </div>

      </div>

    </div>
  `
})
export class RegistroComponent {
  registroForm: FormGroup;
  readonly isSubmitting = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['+51 987 654 321', Validators.required],
      distrito: ['Miraflores', Validators.required],
      direccion: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.registroForm.invalid) return;

    this.isSubmitting.set(true);

    setTimeout(() => {
      const res = this.auth.registro(this.registroForm.value);
      this.isSubmitting.set(false);

      if (res.success) {
        this.notification.success('Cuenta Registrada', res.message);
        this.router.navigate(['/carta']);
      } else {
        this.notification.error('Error de Registro', res.message);
      }
    }, 400);
  }
}
