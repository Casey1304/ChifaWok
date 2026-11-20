import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { PedidosService } from '../../services/pedidos.service';
import { MetricasService } from '../../services/metricas.service';
import { ProductosService } from '../../services/productos.service';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  template: `
    <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      <!-- Admin Sidebar -->
      <app-admin-sidebar></app-admin-sidebar>

      <!-- Main KDS Monitor Area -->
      <main class="flex-1 min-h-0 min-w-0 flex flex-col lg:h-screen overflow-y-auto lg:overflow-hidden bg-background custom-scroll">
        
        <!-- Header & Stats Bar (Matches Stitch design) -->
        <header class="bg-surface border-b border-outline-variant/30 px-4 sm:px-6 py-4 shrink-0 shadow-xs">
          <div class="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span class="text-xs font-black uppercase tracking-wider text-primary">KDS Kitchen Display System</span>
                <span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-black">
                  Turno Almuerzo Activo
                </span>
              </div>
              <h1 class="font-display-lg text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                Panel Operativo — Monitor de Pedidos al Wok
              </h1>
            </div>

            <!-- Operational Stats Pills -->
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <div class="p-2.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-2.5 shadow-xs">
                <span class="material-symbols-outlined text-primary text-xl">payments</span>
                <div>
                  <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Ventas del Día</span>
                  <span class="font-display-lg text-sm font-black text-on-surface">S/ {{ pedidosService.totalVentasDia().toFixed(2) }}</span>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-2.5 shadow-xs">
                <span class="material-symbols-outlined text-secondary text-xl">receipt_long</span>
                <div>
                  <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Órdenes Totales</span>
                  <span class="font-display-lg text-sm font-black text-on-surface">
                    {{ pedidosService.pedidos().length }} órdenes
                  </span>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-2.5 shadow-xs">
                <span class="material-symbols-outlined text-tertiary text-xl">timer</span>
                <div>
                  <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Tiempo Wok</span>
                  <span class="font-display-lg text-sm font-black text-on-surface">{{ tiempoWokPromedio() }} min</span>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-2.5 shadow-xs">
                <span class="material-symbols-outlined text-emerald-600 text-xl">record_voice_over</span>
                <div>
                  <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Eficiencia Voice AI</span>
                  <span class="font-display-lg text-sm font-black text-emerald-700">{{ metricasService.tasaExitoVoiceAI() }}%</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Alerta de stock bajo (calculada desde el inventario de productos) -->
        <div *ngIf="productosStockBajo().length > 0 && !alertaSilenciada()" class="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-red-900 shrink-0">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-red-600 text-base">warning</span>
            <span>
              <strong>Stock bajo:</strong>
              <span *ngFor="let p of productosStockBajo(); let last = last">{{ p.nombre }} ({{ p.stock }} und.){{ last ? '' : ', ' }}</span>.
              Repón desde Gestión de Productos.
            </span>
          </div>
          <button type="button" (click)="silenciarAlerta()" class="text-[11px] font-bold text-red-700 hover:underline self-start sm:self-auto">
            Silenciar 30 min
          </button>
        </div>

        <!-- 3-COLUMN KANBAN BOARD + RIGHT LIVE FEED -->
        <div class="flex-1 flex flex-col lg:flex-row lg:min-h-0 lg:overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6">
          
          <!-- Column 1: NUEVOS / RECIBIDOS -->
          <div class="flex-1 min-w-0 flex flex-col rounded-2xl bg-surface border border-outline-variant/40 shadow-xs overflow-hidden max-h-[70vh] lg:max-h-none">
            <div class="p-3.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 class="font-bold text-xs uppercase tracking-wider text-amber-950">
                  Nuevos / Recibidos
                </h3>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black text-xs">
                {{ pedidosService.pedidosNuevos().length }} comandas
              </span>
            </div>

            <div class="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scroll">
              <div *ngIf="pedidosService.pedidosNuevos().length === 0" class="h-40 flex items-center justify-center text-xs text-on-surface-variant italic">
                No hay comandas nuevas en espera
              </div>

              <div
                *ngFor="let p of pedidosService.pedidosNuevos()"
                class="p-4 rounded-xl border border-outline-variant/40 bg-surface shadow-xs hover:border-primary/60 transition-all space-y-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-black text-sm text-on-surface">{{ p.codigo }}</span>
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"
                      [ngClass]="p.origen === 'voice_ai' ? 'bg-tertiary-fixed text-on-tertiary-fixed font-black' : 'bg-surface-container text-on-surface-variant'"
                    >
                      <span class="material-symbols-outlined text-xs">{{ p.origen === 'voice_ai' ? 'mic' : 'language' }}</span>
                      {{ p.origen === 'voice_ai' ? 'Voice AI' : 'Web' }}
                    </span>
                  </div>
                  <span class="text-[11px] text-on-surface-variant font-medium">{{ p.hora_pedido }}</span>
                </div>

                <div class="text-xs text-on-surface space-y-1 border-y border-surface-container py-2">
                  <p class="font-bold text-on-surface-variant">
                    {{ p.tipo_entrega === 'salon' ? (p.mesa || 'Salón Principal') : (p.tipo_entrega === 'delivery' ? 'Delivery • ' + (p.cliente_direccion || 'Lima') : 'Pide Llevar (Takeout)') }}
                  </p>
                  <div *ngFor="let d of p.detalles" class="flex justify-between font-medium">
                    <span>{{ d.cantidad }}x {{ d.nombre_producto }}</span>
                    <span class="text-on-surface-variant font-mono">S/ {{ d.subtotal.toFixed(2) }}</span>
                  </div>
                  <p *ngIf="p.notas" class="text-[11px] text-amber-800 italic bg-amber-50 p-1.5 rounded mt-1">
                    Nota: {{ p.notas }}
                  </p>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <span class="font-display-lg text-sm font-black text-on-surface">S/ {{ p.total.toFixed(2) }}</span>
                  <div class="flex items-center gap-2">
                    <button
                      (click)="abrirModalCancelar(p)"
                      class="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Cancelar pedido"
                    >
                      <span class="material-symbols-outlined text-base">cancel</span>
                    </button>
                    <button
                      (click)="pasarACocina(p)"
                      class="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-surface-tint text-on-primary font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>Pasar a Wok</span>
                      <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: EN WOK / COCINA -->
          <div class="flex-1 min-w-0 flex flex-col rounded-2xl bg-surface border border-outline-variant/40 shadow-xs overflow-hidden max-h-[70vh] lg:max-h-none">
            <div class="p-3.5 bg-blue-50/80 border-b border-blue-200/80 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                <h3 class="font-bold text-xs uppercase tracking-wider text-blue-950">
                  En Wok / Cocina
                </h3>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-black text-xs">
                {{ pedidosService.pedidosEnCocina().length }} en fuego
              </span>
            </div>

            <div class="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scroll">
              <div *ngIf="pedidosService.pedidosEnCocina().length === 0" class="h-40 flex items-center justify-center text-xs text-on-surface-variant italic">
                Woks libres. No hay comandas en cocción.
              </div>

              <div
                *ngFor="let p of pedidosService.pedidosEnCocina()"
                class="p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs space-y-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-black text-sm text-on-surface">{{ p.codigo }}</span>
                    <span class="text-xs font-bold text-on-surface-variant">• {{ p.cliente_nombre }}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">timer</span>
                    {{ p.tiempo_estimado_entrega || 'Preparando' }}
                  </span>
                </div>

                <div class="text-xs text-on-surface space-y-1 border-y border-surface-container py-2">
                  <div *ngFor="let d of p.detalles" class="flex justify-between font-semibold">
                    <span>{{ d.cantidad }}x {{ d.nombre_producto }}</span>
                  </div>
                  <p *ngIf="p.notas" class="text-[11px] text-blue-900 italic mt-1 bg-white/60 p-1.5 rounded">
                    {{ p.notas }}
                  </p>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <span class="font-display-lg text-sm font-black text-on-surface">S/ {{ p.total.toFixed(2) }}</span>
                  <button
                    (click)="marcarListo(p)"
                    class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-xs">check</span>
                    <span>Marcar Listo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 3: LISTOS PARA DESPACHO -->
          <div class="flex-1 min-w-0 flex flex-col rounded-2xl bg-surface border border-outline-variant/40 shadow-xs overflow-hidden max-h-[70vh] lg:max-h-none">
            <div class="p-3.5 bg-emerald-50/80 border-b border-emerald-200/80 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 class="font-bold text-xs uppercase tracking-wider text-emerald-950">
                  Listos para Despacho
                </h3>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black text-xs">
                {{ pedidosService.pedidosListos().length }} listos
              </span>
            </div>

            <div class="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scroll">
              <div *ngIf="pedidosService.pedidosListos().length === 0" class="h-40 flex items-center justify-center text-xs text-on-surface-variant italic">
                No hay comandas listas esperando entrega
              </div>

              <div
                *ngFor="let p of pedidosService.pedidosListos()"
                class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-black text-sm text-on-surface">{{ p.codigo }}</span>
                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Empaquetado y Caliente
                    </span>
                  </div>
                  <span class="text-xs font-mono font-bold text-on-surface">S/ {{ p.total.toFixed(2) }}</span>
                </div>

                <div class="text-xs text-on-surface-variant space-y-1 border-y border-surface-container py-2">
                  <p *ngIf="p.repartidor" class="font-bold text-on-surface flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">motorcycle</span>
                    Repartidor: {{ p.repartidor }}
                  </p>
                  <p *ngIf="p.cliente_direccion" class="text-[11px] truncate">
                    Destino: {{ p.cliente_direccion }}
                  </p>
                  <p *ngIf="p.mesa" class="text-[11px] font-semibold text-primary">
                    Mesa: {{ p.mesa }}
                  </p>
                </div>

                <button
                  (click)="entregar(p)"
                  class="w-full py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-xs">task_alt</span>
                  <span>Confirmar Entrega</span>
                </button>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDEBAR: LIVE VOICE AI FEED -->
          <div class="w-80 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex flex-col overflow-hidden shrink-0 hidden xl:flex">
            <div class="p-4 border-b border-surface-container bg-surface-container-low flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg" style="font-variation-settings: 'FILL' 1;">mic</span>
                <span class="font-bold text-xs text-on-surface">Actividad Voice AI en Vivo</span>
              </div>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scroll">
              <div
                *ngFor="let s of metricasService.sesiones()"
                class="p-3.5 rounded-xl border border-surface-container bg-surface-container-lowest shadow-xs space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="font-black text-xs text-primary">{{ s.codigo_llamada }} • {{ s.pedido_asociado_codigo ? 'Pedido registrado' : (s.estado === 'aclarando' ? 'Aclaración' : 'Sin confirmar') }}</span>
                  <span class="text-[10px] text-on-surface-variant font-medium">{{ s.hora }}</span>
                </div>
                
                <p class="text-xs text-on-surface font-medium leading-relaxed italic">
                  "{{ s.transcripcion_usuario }}"
                </p>

                <div class="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container">
                  <span class="font-semibold" [ngClass]="s.exitosa ? 'text-emerald-700' : 'text-amber-700'">{{ s.exitosa ? '✓' : '?' }} Confianza: {{ s.confianza }}%</span>
                  <span *ngIf="s.pedido_asociado_codigo" class="font-bold text-primary">
                    Orden {{ s.pedido_asociado_codigo }}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      <!-- Cancel Order Modal -->
      <div *ngIf="pedidoACancelar" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div (click)="pedidoACancelar = null" class="absolute inset-0 bg-black/40 backdrop-blur-xs"></div>
        <div class="relative w-full max-w-md p-6 rounded-2xl bg-surface shadow-2xl border border-outline-variant/40 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">warning</span>
            </div>
            <div>
              <h3 class="font-headline-md text-base font-bold text-on-surface">Cancelar Comanda {{ pedidoACancelar.codigo }}</h3>
              <p class="text-xs text-on-surface-variant">Esta acción notificará al cliente y anulará el ticket.</p>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-on-surface">Motivo de Cancelación</label>
            <select [(ngModel)]="motivoCancelacion" class="w-full text-xs px-3 py-2 rounded-xl border border-outline-variant bg-surface">
              <option value="Insumo agotado en cocina">Insumo agotado en cocina</option>
              <option value="Solicitud directa del cliente">Solicitud directa del cliente</option>
              <option value="Dirección fuera de cobertura">Dirección fuera de cobertura</option>
              <option value="Error de transcripción">Error de transcripción</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              (click)="pedidoACancelar = null"
              class="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container"
            >
              Regresar
            </button>
            <button
              (click)="confirmarCancelacion()"
              class="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs"
            >
              Confirmar Anulación
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminPedidosComponent {
  pedidoACancelar: Pedido | null = null;
  motivoCancelacion = 'Insumo agotado en cocina';

  private readonly STOCK_MINIMO = 10;
  private readonly ALERTA_KEY = 'alerta_stock_silenciada_hasta';
  private readonly silenciadaHasta = signal<number>(0);
  private readonly ahora = signal<number>(Date.now());

  /** Platos disponibles con stock igual o menor al mínimo. */
  readonly productosStockBajo = computed(() =>
    this.productosService.productos().filter(p => p.disponible && p.stock <= this.STOCK_MINIMO)
  );

  readonly alertaSilenciada = computed(() => this.silenciadaHasta() > this.ahora());

  /** Tiempo de preparación medio (min) de los platos en las comandas activas. */
  readonly tiempoWokPromedio = computed(() => {
    const activos = this.pedidosService.pedidos().filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion');
    let minutos = 0;
    let unidades = 0;
    for (const p of activos) {
      for (const d of p.detalles) {
        const prod = this.productosService.getProductoById(d.id_producto);
        minutos += (prod?.tiempo_preparacion_min || 8) * d.cantidad;
        unidades += d.cantidad;
      }
    }
    return unidades ? Math.round((minutos / unidades) * 10) / 10 : 0;
  });

  constructor(
    public pedidosService: PedidosService,
    public metricasService: MetricasService,
    private productosService: ProductosService,
    private storage: StorageService,
    private notification: NotificationService
  ) {
    this.silenciadaHasta.set(this.storage.get<number>(this.ALERTA_KEY, 0));
  }

  pasarACocina(p: Pedido): void {
    this.pedidosService.actualizarEstado(p.id_pedido, 'en_preparacion', 'Salteando al wok (~7 min)');
    this.notification.info('Comanda en Cocina', `La orden ${p.codigo} pasó al wok.`);
  }

  marcarListo(p: Pedido): void {
    this.pedidosService.marcarListo(p.id_pedido);
    this.notification.success('Platos Listos', `La orden ${p.codigo} está empaquetada para despacho.`);
  }

  entregar(p: Pedido): void {
    this.pedidosService.marcarEntregado(p.id_pedido);
    this.notification.success('Comanda Entregada', `La orden ${p.codigo} fue despachada exitosamente.`);
  }

  abrirModalCancelar(p: Pedido): void {
    this.pedidoACancelar = p;
  }

  confirmarCancelacion(): void {
    if (!this.pedidoACancelar) return;
    this.pedidosService.cancelarPedido(this.pedidoACancelar.id_pedido, this.motivoCancelacion);
    this.notification.warning('Comanda Cancelada', `La orden ${this.pedidoACancelar.codigo} fue anulada.`);
    this.pedidoACancelar = null;
  }

  silenciarAlerta(): void {
    const hasta = Date.now() + 30 * 60 * 1000;
    this.storage.set(this.ALERTA_KEY, hasta);
    this.silenciadaHasta.set(hasta);
    this.ahora.set(Date.now());
    this.notification.info('Alerta Silenciada', 'Se ocultó el aviso de stock por 30 minutos.');
  }
}
