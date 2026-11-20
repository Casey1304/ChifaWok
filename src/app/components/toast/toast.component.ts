import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <div
        *ngFor="let toast of notification.toasts()"
        class="pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all duration-300 animate-[fadeInUp_0.3s_ease-out]"
        [ngClass]="{
          'bg-emerald-50 border-emerald-300 text-emerald-950': toast.tipo === 'success',
          'bg-red-50 border-red-300 text-red-950': toast.tipo === 'error',
          'bg-amber-50 border-amber-300 text-amber-950': toast.tipo === 'warning',
          'bg-blue-50 border-blue-300 text-blue-950': toast.tipo === 'info'
        }"
      >
        <span
          class="material-symbols-outlined text-xl shrink-0"
          [ngClass]="{
            'text-emerald-600': toast.tipo === 'success',
            'text-red-600': toast.tipo === 'error',
            'text-amber-600': toast.tipo === 'warning',
            'text-blue-600': toast.tipo === 'info'
          }"
        >
          {{
            toast.tipo === 'success' ? 'check_circle' :
            toast.tipo === 'error' ? 'cancel' :
            toast.tipo === 'warning' ? 'warning' : 'info'
          }}
        </span>
        <div class="flex-1">
          <p class="font-bold text-sm leading-tight">{{ toast.titulo }}</p>
          <p class="text-xs text-on-surface-variant mt-0.5 leading-snug">{{ toast.mensaje }}</p>
        </div>
        <button
          (click)="notification.dismiss(toast.id)"
          class="text-on-surface-variant hover:text-on-background transition-colors p-1"
        >
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public notification: NotificationService) {}
}
