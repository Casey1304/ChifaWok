import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly toasts = signal<ToastNotification[]>([]);

  show(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje: string, duracionMs = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastNotification = { id, tipo, titulo, mensaje };

    this.toasts.update(list => [...list, toast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duracionMs);
  }

  success(titulo: string, mensaje: string): void {
    this.show('success', titulo, mensaje);
  }

  error(titulo: string, mensaje: string): void {
    this.show('error', titulo, mensaje);
  }

  warning(titulo: string, mensaje: string): void {
    this.show('warning', titulo, mensaje);
  }

  info(titulo: string, mensaje: string): void {
    this.show('info', titulo, mensaje);
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
