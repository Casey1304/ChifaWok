import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VoiceAiService } from '../../services/voice-ai.service';
import { PedidosService } from '../../services/pedidos.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ClientesService } from '../../services/clientes.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-voice-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="voice.isModalOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <!-- Backdrop -->
      <div
        (click)="voice.closeModal()"
        class="absolute inset-0 bg-on-background/40 backdrop-blur-sm"
      ></div>

      <!-- Modal Card -->
      <div class="glass-overlay w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-[fadeInUp_0.35s_ease-out] border border-white/60 bg-surface/95 max-h-[90vh]">
        
        <!-- Top Bar -->
        <div class="flex items-center justify-between p-4 sm:p-5 border-b border-surface-variant/40 bg-surface-container-low/40">
          <div class="flex items-center gap-3">
            <div class="relative flex items-center justify-center w-10 h-10">
              <div
                *ngIf="voice.isListening()"
                class="absolute inset-0 bg-tertiary rounded-full opacity-30 ai-pulse"
              ></div>
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                [ngClass]="voice.isListening() ? 'bg-primary animate-pulse' : 'bg-tertiary-container'"
              >
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">
                  {{ voice.isListening() ? 'graphic_eq' : 'smart_toy' }}
                </span>
              </div>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <span class="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                  Asistente Mei
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-800 border border-emerald-300': voice.voiceState() === 'listening',
                    'bg-blue-100 text-blue-800': voice.voiceState() === 'speaking',
                    'bg-amber-100 text-amber-800': voice.voiceState() === 'processing',
                    'bg-surface-container text-on-surface-variant': voice.voiceState() === 'idle' || voice.voiceState() === 'ready_to_confirm',
                    'bg-red-100 text-red-800': voice.voiceState() === 'error'
                  }"
                >
                  {{
                    voice.voiceState() === 'listening' ? '🎙️ Escuchando...' :
                    voice.voiceState() === 'speaking' ? '🔊 Hablando...' :
                    voice.voiceState() === 'processing' ? '⚡ Interpretando...' :
                    voice.voiceState() === 'ready_to_confirm' ? '✓ Pedido Listo' :
                    voice.voiceState() === 'clarification' ? '❓ Aclaración' :
                    voice.voiceState() === 'error' ? '⚠️ Aviso' : 'En línea (es-PE)'
                  }}
                </span>
              </div>
              <p class="text-[11px] text-on-surface-variant">Inteligencia Artificial para pedidos rápidos al Wok</p>
            </div>
          </div>

          <button
            (click)="voice.closeModal()"
            class="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Transcript & Chat Area -->
        <div class="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 custom-scroll max-h-[50vh]">
          
          <!-- Mei Welcome / Active Message -->
          <div class="flex flex-col items-start gap-1">
            <span class="font-label-sm text-[11px] text-tertiary font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">smart_toy</span> Mei (Chifa Wok)
            </span>
            <div class="bg-tertiary-fixed/40 px-4 py-3 rounded-2xl rounded-tl-xs max-w-[90%] border border-tertiary-fixed-dim/40 shadow-xs text-on-surface text-sm leading-relaxed">
              <p>{{ voice.meiResponse() || '¡Hola! Soy Mei. Puedes decirme qué platos deseas, por ejemplo: "Quiero un arroz chaufa especial y una Inka Kola de litro bien helada".' }}</p>
              
              <button
                *ngIf="voice.meiResponse()"
                (click)="voice.speak(voice.meiResponse())"
                class="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-tertiary hover:underline"
              >
                <span class="material-symbols-outlined text-xs">volume_up</span>
                Escuchar de nuevo
              </button>
            </div>
          </div>

          <!-- User Spoken / Typed Input -->
          <div *ngIf="voice.transcript()" class="flex flex-col items-end gap-1">
            <span class="font-label-sm text-[11px] text-on-surface-variant font-semibold">Tú</span>
            <div class="bg-surface-container-highest px-4 py-3 rounded-2xl rounded-tr-xs max-w-[85%] border border-surface-variant/60 shadow-xs">
              <p class="text-sm font-medium text-on-surface">"{{ voice.transcript() }}"</p>
            </div>
          </div>

          <!-- Soundwave Animation when Listening -->
          <div *ngIf="voice.isListening()" class="flex flex-col items-center justify-center py-4 bg-tertiary-fixed/20 rounded-xl border border-tertiary-fixed-dim/30">
            <div class="flex items-center gap-1.5 h-8">
              <span class="w-1.5 bg-primary rounded-full wave-bar-1"></span>
              <span class="w-1.5 bg-primary rounded-full wave-bar-2"></span>
              <span class="w-1.5 bg-primary rounded-full wave-bar-3"></span>
              <span class="w-1.5 bg-primary rounded-full wave-bar-4"></span>
              <span class="w-1.5 bg-primary rounded-full wave-bar-5"></span>
            </div>
            <p class="text-xs font-bold text-primary mt-2">Escuchando tu voz en español peruano (es-PE)...</p>
            <p class="text-[11px] text-on-surface-variant">Habla con libertad: puedes usar términos como "bien taipá" o "al toque"</p>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="voice.errorMessage()" class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
            <span class="material-symbols-outlined text-red-600 shrink-0 text-lg">info</span>
            <div class="flex-1">
              <p class="font-bold">Aviso del sistema de voz</p>
              <p class="text-[11px] text-red-800 mt-0.5">{{ voice.errorMessage() }}</p>
            </div>
          </div>

          <!-- Interpreted Order Summary Card -->
          <div
            *ngIf="voice.interpretedOrder() as order"
            class="p-4 rounded-xl border-2 border-primary/30 bg-surface-container-low space-y-3"
          >
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl">fact_check</span>
                <span class="font-bold text-sm text-on-surface">Resumen Interpretado por Mei</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                Validado con la Carta
              </span>
            </div>

            <!-- Items List -->
            <div class="space-y-1.5">
              <div
                *ngFor="let item of order.items"
                class="flex items-center justify-between text-xs py-1 border-b border-surface-container/60"
              >
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px]">
                    {{ item.cantidad }}
                  </span>
                  <span class="font-semibold text-on-surface">{{ item.producto.nombre }}</span>
                </div>
                <span class="font-bold text-on-surface">S/ {{ item.subtotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Modifiers / Slang Badges -->
            <div *ngIf="order.modificadoresJerga.length > 0" class="pt-1">
              <p class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Jerga y Especificaciones detectadas:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  *ngFor="let j of order.modificadoresJerga"
                  class="px-2 py-0.5 rounded-md bg-secondary-container/70 text-on-secondary-container text-[11px] font-bold"
                >
                  ⚡ {{ j }}
                </span>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div class="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
              <div>
                <span class="text-xs text-on-surface-variant">Total del Pedido (inc. IGV):</span>
                <p class="font-display-lg text-lg font-black text-primary">S/ {{ order.total.toFixed(2) }}</p>
              </div>
              <div class="text-right text-[11px] text-on-surface-variant">
                <span>Modalidad: <strong>{{ order.tipoEntrega | titlecase }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls & Text Fallback Input -->
        <div class="p-4 border-t border-surface-variant/40 bg-surface-container-low/70 space-y-3">
          
          <!-- Text input fallback -->
          <form (ngSubmit)="sendManualText()" class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="manualInputText"
              name="manualText"
              placeholder="O escribe tu pedido aquí (ej: 1 chaufa especial y wantanes)..."
              class="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden bg-surface"
            />
            <button
              type="submit"
              [disabled]="!manualInputText.trim()"
              class="px-3.5 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-container text-on-surface text-xs font-bold transition-all disabled:opacity-40"
              title="Enviar texto a Mei"
            >
              <span class="material-symbols-outlined text-base">send</span>
            </button>
          </form>

          <!-- Action Buttons Bar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            
            <!-- Mic Control Button -->
            <button
              type="button"
              (click)="toggleListening()"
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              [ngClass]="voice.isListening() ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-tertiary-container hover:bg-tertiary text-white'"
            >
              <span class="material-symbols-outlined text-lg">
                {{ voice.isListening() ? 'mic_off' : 'mic' }}
              </span>
              <span>{{ voice.isListening() ? 'Detener Escucha' : 'Iniciar Escucha' }}</span>
            </button>

            <div class="w-full sm:w-auto flex items-center justify-end gap-2">
              <button
                type="button"
                (click)="voice.closeModal()"
                class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-container transition-colors"
              >
                Cerrar
              </button>

              <button
                type="button"
                *ngIf="voice.interpretedOrder()"
                (click)="confirmOrder()"
                class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-surface-tint shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Confirmar Pedido</span>
                <span class="material-symbols-outlined text-sm">check_circle</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class VoiceModalComponent {
  manualInputText = '';

  constructor(
    public voice: VoiceAiService,
    private pedidosService: PedidosService,
    private cart: CartService,
    private auth: AuthService,
    private clientesService: ClientesService,
    private notification: NotificationService,
    private router: Router
  ) {}

  toggleListening(): void {
    if (this.voice.isListening()) {
      this.voice.stopListening();
    } else {
      this.voice.startListening();
    }
  }

  sendManualText(): void {
    if (!this.manualInputText.trim()) return;
    this.voice.processManualText(this.manualInputText);
    this.manualInputText = '';
  }

  confirmOrder(): void {
    const order = this.voice.interpretedOrder();
    if (!order) return;

    const user = this.auth.currentUser();
    const idCliente = this.clientesService.idClienteDeUsuario(user);
    if (!user || idCliente === null) {
      // Los pedidos pertenecen a un comensal: sin sesión de cliente no se puede asignar el pedido.
      this.notification.warning(
        'Inicia sesión como comensal',
        'Ingresa con tu cuenta de cliente para que Mei registre tu pedido.'
      );
      this.voice.closeModal();
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const detalles = order.items.map((i, idx) => ({
      id_detalle: idx + 1,
      id_producto: i.producto.id_producto,
      nombre_producto: i.producto.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.producto.precio,
      subtotal: i.subtotal,
      notas_especiales: order.notasGenerales
    }));

    const nuevo = this.pedidosService.crearPedido({
      idCliente,
      clienteNombre: `${user.nombre} ${user.apellido}`,
      clienteTelefono: user.telefono || '',
      clienteDireccion: user.direccion,
      tipoEntrega: order.tipoEntrega,
      notas: order.notasGenerales,
      detalles: detalles,
      origen: 'voice_ai'
    });

    this.voice.closeModal();

    this.notification.success(
      '¡Pedido por Voz Registrado!',
      `Mei envió tu orden ${nuevo.codigo} directo al Wok. Total: S/ ${nuevo.total.toFixed(2)}.`
    );

    this.router.navigate(['/mis-pedidos']);
  }
}
