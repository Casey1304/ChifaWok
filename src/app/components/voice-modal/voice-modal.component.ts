import { Component, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DudaVista, InterpretedItem, VoiceAiService } from '../../services/voice-ai.service';
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
                    'bg-surface-container text-on-surface-variant': voice.voiceState() === 'idle',
                    'bg-emerald-100 text-emerald-800': voice.voiceState() === 'ready_to_confirm' || voice.voiceState() === 'identified' || voice.voiceState() === 'registered',
                    'bg-amber-100 text-amber-900': voice.voiceState() === 'clarification',
                    'bg-red-100 text-red-800': voice.voiceState() === 'error'
                  }"
                >
                  {{
                    voice.voiceState() === 'listening' ? '🎙️ Escuchando...' :
                    voice.voiceState() === 'speaking' ? '🔊 Hablando...' :
                    voice.voiceState() === 'processing' ? '⚡ Interpretando...' :
                    voice.voiceState() === 'ready_to_confirm' ? '✓ Listo para confirmar' :
                    voice.voiceState() === 'identified' ? '✓ Producto identificado' :
                    voice.voiceState() === 'registered' ? '✅ Pedido registrado' :
                    voice.voiceState() === 'clarification' ? '❓ Necesita aclaración' :
                    voice.voiceState() === 'error' ? '⚠️ Aviso' : 'En línea (es-PE)'
                  }}
                </span>
              </div>
              <p class="text-[11px] text-on-surface-variant">Inteligencia Artificial para pedidos rápidos al Wok</p>
            </div>
          </div>

          <button
            type="button"
            (click)="voice.closeModal()"
            aria-label="Cerrar asistente Mei"
            class="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Transcript & Chat Area -->
        <div #chat class="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-4 custom-scroll">
          
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

          <!-- Navegador sin Web Speech API -->
          <div *ngIf="!voice.isBrowserSupported()" class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <span class="material-symbols-outlined text-amber-600 shrink-0 text-lg">mic_off</span>
            <p>
              Este navegador no ofrece reconocimiento de voz. Para hablar con Mei usa <strong>Google Chrome</strong> o
              <strong>Microsoft Edge</strong> (con conexión a Internet). Mientras tanto, puedes escribir tu pedido abajo.
            </p>
          </div>

          <!-- User Spoken / Typed Input -->
          <div *ngIf="voice.transcript()" class="flex flex-col items-end gap-1">
            <span class="font-label-sm text-[11px] text-on-surface-variant font-semibold">
              Tú · {{ voice.entradaPorVoz() ? '🎙️ reconocido por voz' : '⌨️ escrito' }}
            </span>
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

          <!-- Sugerencias de Mei: platos dudosos, genéricos o fuera de carta -->
          <div
            *ngFor="let duda of voice.dudas(); trackBy: trackDuda"
            class="p-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low shadow-xs space-y-3"
            role="group"
            [attr.aria-label]="'Opciones para ' + duda.texto"
          >
            <div class="flex items-start gap-2">
              <span class="material-symbols-outlined text-tertiary text-lg shrink-0" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
              <div class="space-y-0.5">
                <p class="font-bold text-sm text-on-surface">
                  {{
                    duda.tipo === 'probable' ? '¿Te refieres a ' + duda.opciones[0].producto.nombre + '?' :
                    duda.tipo === 'no_existe' ? 'No tenemos «' + duda.texto + '» en la carta' :
                    'Encontré estos platos parecidos. ¿Cuál de ellos deseas?'
                  }}
                </p>
                <p class="text-[11px] text-on-surface-variant">
                  Escuché «{{ duda.texto }}» · Cantidad: <strong>{{ duda.cantidad }}</strong>
                  <span *ngIf="duda.tipo === 'no_existe' && duda.opciones.length"> · Platos de la carta parecidos:</span>
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <button
                type="button"
                *ngFor="let op of duda.opciones; let primera = first"
                (click)="voice.elegirSugerencia(duda.id, op.producto.id_producto)"
                class="w-full px-4 py-3 rounded-xl border bg-surface hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-3 text-left group"
                [ngClass]="duda.tipo === 'probable' && primera ? 'border-primary/60' : 'border-outline-variant/60'"
              >
                <span class="w-4 h-4 rounded-full border-2 border-outline-variant group-hover:border-primary group-hover:bg-primary shrink-0 transition-colors"></span>
                <span class="flex-1 min-w-0">
                  <span class="block font-bold text-sm text-on-surface truncate">{{ op.producto.nombre }}</span>
                  <span class="block text-[11px] text-on-surface-variant">
                    S/ {{ op.producto.precio.toFixed(2) }} · {{ op.producto.categoria_nombre }}
                  </span>
                </span>
                <span
                  *ngIf="duda.tipo === 'probable' && primera"
                  class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0"
                >
                  Sí, ese plato
                </span>
              </button>

              <button
                type="button"
                (click)="voice.descartarDuda(duda.id)"
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container transition-colors flex items-center gap-3 text-left"
              >
                <span class="w-4 h-4 rounded-full border-2 border-outline-variant shrink-0"></span>
                <span class="font-bold text-sm text-on-surface-variant">Ninguno de estos</span>
              </button>
            </div>
          </div>

          <!-- Pedido registrado -->
          <div
            *ngIf="voice.voiceState() === 'registered' && voice.pedidoRegistrado() as registrado"
            class="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 space-y-3"
          >
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-700 text-2xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              <div>
                <p class="font-bold text-sm text-emerald-900">Pedido {{ registrado.codigo }} registrado</p>
                <p class="text-[11px] text-emerald-800">Total S/ {{ registrado.total.toFixed(2) }} · En la cola del wok</p>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                (click)="verMisPedidos()"
                class="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
              >
                Ver Mis Pedidos
              </button>
              <button
                type="button"
                (click)="nuevoPedido()"
                class="flex-1 px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                Hacer otro pedido
              </button>
            </div>
          </div>

          <!-- Interpreted Order Summary Card -->
          <div
            *ngIf="voice.interpretedOrder() as order"
            [hidden]="order.items.length === 0"
            class="p-4 rounded-xl border-2 border-primary/30 bg-surface-container-low space-y-3"
          >
            <div class="flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl">fact_check</span>
                <span class="font-bold text-sm text-on-surface">Tu pedido con Mei</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 rounded-full font-black text-[11px]"
                  [ngClass]="voice.dudas().length === 0 && order.items.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'"
                >
                  {{ voice.dudas().length > 0 ? 'Falta elegir' : (order.items.length > 0 ? 'Validado con la Carta' : 'Sin platos') }}
                </span>
                <button
                  type="button"
                  *ngIf="order.items.length > 0"
                  (click)="voice.vaciarPedido()"
                  class="text-[11px] font-bold text-on-surface-variant hover:text-red-700"
                >
                  Vaciar
                </button>
              </div>
            </div>

            <!-- Items: cantidades editables y eliminación -->
            <p *ngIf="order.items.length === 0" class="text-xs text-on-surface-variant italic">
              Aún no hay platos confirmados.
            </p>
            <div class="space-y-1.5">
              <div
                *ngFor="let item of order.items; trackBy: trackItem"
                class="flex items-center justify-between gap-2 text-xs py-1 border-b border-surface-container/60"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      (click)="voice.cambiarCantidad(item.producto.id_producto, -1)"
                      [attr.aria-label]="'Quitar una unidad de ' + item.producto.nombre"
                      class="w-6 h-6 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container font-bold"
                    >-</button>
                    <span class="w-6 text-center font-black text-primary">{{ item.cantidad }}</span>
                    <button
                      type="button"
                      (click)="voice.cambiarCantidad(item.producto.id_producto, 1)"
                      [attr.aria-label]="'Agregar una unidad de ' + item.producto.nombre"
                      class="w-6 h-6 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container font-bold"
                    >+</button>
                  </div>
                  <span class="font-semibold text-on-surface truncate">{{ item.producto.nombre }}</span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="font-bold text-on-surface">S/ {{ item.subtotal.toFixed(2) }}</span>
                  <button
                    type="button"
                    (click)="voice.quitarItem(item.producto.id_producto)"
                    [attr.aria-label]="'Eliminar ' + item.producto.nombre"
                    class="p-1 rounded-full text-on-surface-variant hover:text-red-700 hover:bg-red-50"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Avisos: no reconocidos, no disponibles, ambiguos -->
            <div *ngIf="order.avisos.length > 0" class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <p class="font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">help</span>
                Revisa antes de confirmar
              </p>
              <p *ngFor="let a of order.avisos">{{ a }}</p>
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
                <span class="text-xs text-on-surface-variant">
                  Incluye IGV (18%): S/ {{ order.impuestos.toFixed(2) }}
                </span>
                <span class="block text-xs text-on-surface-variant">Total del Pedido:</span>
                <p class="font-display-lg text-lg font-black text-primary">S/ {{ order.total.toFixed(2) }}</p>
              </div>
              <div class="text-right text-[11px] text-on-surface-variant">
                <span>Modalidad: <strong>{{ order.tipoEntrega | titlecase }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls & Text Fallback Input -->
        <div class="p-4 border-t border-surface-variant/40 bg-surface-container-low/70 space-y-3 shrink-0">
          
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

          <p *ngIf="voice.dudas().length > 0" class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Elige un plato de las opciones o pulsa «Ninguno de estos». También puedes hablar o escribir de nuevo.
          </p>

          <p *ngIf="voice.interpretedOrder()?.items?.length && !esComensal()" class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Para registrar el pedido debes iniciar sesión como comensal. Al confirmar, los platos se guardarán en tu carrito.
          </p>

          <!-- Action Buttons Bar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            
            <!-- Mic Control Button -->
            <button
              type="button"
              (click)="toggleListening()"
              [disabled]="!voice.isBrowserSupported()"
              [title]="voice.isBrowserSupported() ? 'Hablar con Mei' : 'Reconocimiento de voz no disponible en este navegador'"
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              [ngClass]="voice.isListening() ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-tertiary-container hover:bg-tertiary text-white'"
            >
              <span class="material-symbols-outlined text-lg">
                {{ voice.isListening() ? 'mic_off' : 'mic' }}
              </span>
              <span>{{ voice.isListening() ? 'Detener y Procesar' : (voice.transcript() ? 'Hablar de Nuevo' : 'Iniciar Escucha') }}</span>
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
                *ngIf="voice.interpretedOrder()?.items?.length"
                (click)="confirmOrder()"
                [disabled]="confirmando || voice.isListening() || voice.dudas().length > 0 || !voice.interpretedOrder()!.items.length"
                class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-surface-tint shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
  /** Evita registrar dos veces el mismo pedido por clics repetidos. */
  confirmando = false;

  @ViewChild('chat') private chat?: ElementRef<HTMLElement>;

  constructor(
    public voice: VoiceAiService,
    private pedidosService: PedidosService,
    private cart: CartService,
    private auth: AuthService,
    private clientesService: ClientesService,
    private notification: NotificationService,
    private router: Router
  ) {
    // Al aparecer sugerencias o cambiar el pedido, se muestran sin que el comensal tenga que desplazarse.
    effect(() => {
      const hayDudas = this.voice.dudas().length > 0;
      this.voice.interpretedOrder();
      this.voice.voiceState();
      setTimeout(() => {
        const contenedor = this.chat?.nativeElement;
        if (!contenedor) return;
        const objetivo = hayDudas ? contenedor.querySelector('[role="group"]') : null;
        if (objetivo) objetivo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        else contenedor.scrollTo({ top: contenedor.scrollHeight, behavior: 'smooth' });
      });
    });
  }

  toggleListening(): void {
    if (this.voice.isListening()) {
      this.voice.stopListening();
    } else {
      this.voice.startListening();
    }
  }

  esComensal(): boolean {
    return this.clientesService.idClienteDeUsuario(this.auth.currentUser()) !== null;
  }

  sendManualText(): void {
    if (!this.manualInputText.trim()) return;
    this.voice.processManualText(this.manualInputText);
    this.manualInputText = '';
  }

  confirmOrder(): void {
    const order = this.voice.interpretedOrder();
    if (!order || order.items.length === 0 || this.voice.dudas().length > 0 || this.confirmando || this.voice.isListening()) return;

    const user = this.auth.currentUser();
    const idCliente = this.clientesService.idClienteDeUsuario(user);
    if (!user || idCliente === null) {
      // Los pedidos pertenecen a un comensal: se conservan los platos en el carrito y se pide iniciar sesión.
      order.items.forEach(i => this.cart.addItem(i.producto, i.cantidad, order.notasGenerales || undefined));
      this.notification.warning(
        'Inicia sesión como comensal',
        'Guardamos los platos de Mei en tu carrito. Ingresa con tu cuenta de cliente para confirmar el pedido.'
      );
      this.voice.closeModal();
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/carta' } });
      return;
    }

    this.confirmando = true;

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

    // Mei muestra el estado "Pedido registrado" y enlaza las sesiones de voz al pedido.
    this.voice.marcarRegistrado(nuevo.codigo, nuevo.total);
    this.confirmando = false;

    this.notification.success(
      '¡Pedido por Voz Registrado!',
      `Mei envió tu orden ${nuevo.codigo} directo al Wok. Total: S/ ${nuevo.total.toFixed(2)}.`
    );
  }

  verMisPedidos(): void {
    this.voice.closeModal();
    this.router.navigate(['/mis-pedidos']);
  }

  /** Segundo pedido sin recargar: limpia la conversación y deja a Mei lista. */
  nuevoPedido(): void {
    this.voice.resetState();
    this.voice.meiResponse.set('¿Qué más te preparo? Puedes hablar o escribir tu pedido.');
  }

  trackDuda(_: number, duda: DudaVista): number {
    return duda.id;
  }

  trackItem(_: number, item: InterpretedItem): number {
    return item.producto.id_producto;
  }
}
