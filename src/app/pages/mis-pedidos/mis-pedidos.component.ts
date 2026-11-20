import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PedidosService } from '../../services/pedidos.service';
import { AuthService } from '../../services/auth.service';
import { ClientesService } from '../../services/clientes.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-primary">Seguimiento en Vivo</span>
            <h1 class="font-display-lg text-3xl font-black text-on-surface mt-0.5">Mis Pedidos</h1>
            <p class="text-xs text-on-surface-variant mt-1">
              Monitorea el progreso de tus órdenes en cocina y revisa tu historial gastronómico.
            </p>
          </div>

          <a
            routerLink="/carta"
            class="px-4 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-surface-tint transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">restaurant_menu</span>
            <span>Hacer Nuevo Pedido</span>
          </a>
        </div>

        <!-- PEDIDO ACTIVO EN CURSO -->
        <div *ngIf="pedidoActivo() as activo" class="rounded-2xl border-2 border-primary/30 bg-surface shadow-md overflow-hidden">
          <div class="p-5 bg-surface-container-low border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <span class="font-display-lg text-lg font-black text-on-surface">Pedido Activo {{ activo.codigo }}</span>
                <p class="text-xs text-on-surface-variant">
                  Registrado hoy a las {{ activo.hora_pedido }} • Origen: 
                  <strong class="text-primary">{{ activo.origen === 'voice_ai' ? 'Voice AI Mei' : 'Plataforma Web' }}</strong>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold"
                [ngClass]="{
                  'bg-amber-100 text-amber-900 border border-amber-300': activo.estado === 'pendiente',
                  'bg-blue-100 text-blue-900 border border-blue-300': activo.estado === 'en_preparacion',
                  'bg-emerald-100 text-emerald-900 border border-emerald-300': activo.estado === 'entregado',
                  'bg-red-100 text-red-900': activo.estado === 'cancelado'
                }"
              >
                {{
                  activo.estado === 'pendiente' ? '⏳ Recibido en Restaurante' :
                  activo.estado === 'en_preparacion' ? '🔥 En Preparación al Wok' :
                  activo.estado === 'entregado' ? '✓ Entregado' : 'Cancelado'
                }}
              </span>

              <span *ngIf="activo.prioridad === 'alta'" class="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container text-[11px] font-black">
                Al Toque
              </span>
            </div>
          </div>

          <!-- STEPPER TRACKING BAR (Matches Stitch design) -->
          <div class="p-6 sm:p-8 border-b border-surface-container bg-surface">
            <div class="relative flex items-center justify-between max-w-2xl mx-auto">
              <!-- Connecting line -->
              <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container z-0"></div>
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-700"
                [style.width]="
                  activo.estado === 'pendiente' ? '15%' :
                  (activo.estado === 'en_preparacion' ? (activo.tiempo_estimado_entrega?.includes('Listo') ? '75%' : '45%') : '100%')
                "
              ></div>

              <!-- Step 1: Recibido -->
              <div class="relative z-10 flex flex-col items-center gap-2">
                <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <span class="material-symbols-outlined text-lg">check</span>
                </div>
                <span class="text-xs font-bold text-on-surface">Recibido</span>
                <span class="text-[10px] text-on-surface-variant font-medium">{{ activo.hora_pedido }}</span>
              </div>

              <!-- Step 2: Preparando (Wok) -->
              <div class="relative z-10 flex flex-col items-center gap-2">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors"
                  [ngClass]="activo.estado === 'en_preparacion' || activo.estado === 'entregado' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'"
                >
                  <span class="material-symbols-outlined text-lg" [ngClass]="activo.estado === 'en_preparacion' ? 'animate-bounce' : ''">skillet</span>
                </div>
                <span class="text-xs font-bold" [ngClass]="activo.estado === 'en_preparacion' ? 'text-primary' : 'text-on-surface-variant'">
                  En Wok
                </span>
                <span class="text-[10px] text-on-surface-variant font-medium">Cocina en marcha</span>
              </div>

              <!-- Step 3: En camino / Listo -->
              <div class="relative z-10 flex flex-col items-center gap-2">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors"
                  [ngClass]="activo.estado === 'entregado' || (activo.tiempo_estimado_entrega?.includes('Listo')) ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'"
                >
                  <span class="material-symbols-outlined text-lg">delivery_dining</span>
                </div>
                <span class="text-xs font-bold" [ngClass]="activo.tiempo_estimado_entrega?.includes('Listo') ? 'text-primary' : 'text-on-surface-variant'">
                  {{ activo.tipo_entrega === 'salon' ? 'Listo en Mesa' : (activo.tipo_entrega === 'recojo' ? 'Listo en Barra' : 'En camino') }}
                </span>
                <span class="text-[10px] text-on-surface-variant font-medium">{{ activo.tiempo_estimado_entrega || '15-20 min' }}</span>
              </div>

              <!-- Step 4: Entregado -->
              <div class="relative z-10 flex flex-col items-center gap-2">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors"
                  [ngClass]="activo.estado === 'entregado' ? 'bg-emerald-600 text-white' : 'bg-surface-container text-on-surface-variant'"
                >
                  <span class="material-symbols-outlined text-lg">home</span>
                </div>
                <span class="text-xs font-bold" [ngClass]="activo.estado === 'entregado' ? 'text-emerald-700' : 'text-on-surface-variant'">
                  Entregado
                </span>
                <span class="text-[10px] text-on-surface-variant font-medium">¡Buen provecho!</span>
              </div>

            </div>
          </div>

          <!-- Order Content & Cost Details -->
          <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 space-y-3">
              <h4 class="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Platillos Ordenados</h4>
              
              <div class="space-y-2">
                <div
                  *ngFor="let det of activo.detalles"
                  class="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between text-xs"
                >
                  <div>
                    <p class="font-bold text-on-surface">{{ det.cantidad }}x {{ det.nombre_producto }}</p>
                    <p *ngIf="det.notas_especiales" class="text-[11px] text-amber-800 italic mt-0.5">
                      Especificación: {{ det.notas_especiales }}
                    </p>
                  </div>
                  <span class="font-bold text-on-surface">S/ {{ det.subtotal.toFixed(2) }}</span>
                </div>
              </div>

              <div *ngIf="activo.notas" class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                <strong>Notas de cocina:</strong> {{ activo.notas }}
              </div>
            </div>

            <!-- Cost Summary Box -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2.5 h-fit">
              <h4 class="font-bold text-xs uppercase tracking-wider text-on-surface-variant pb-1 border-b border-surface-container">
                Resumen de Cuenta
              </h4>
              <div class="flex justify-between text-xs text-on-surface-variant">
                <span>Op. gravada (sin IGV):</span>
                <span class="font-semibold text-on-surface">S/ {{ activo.subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xs text-on-surface-variant">
                <span>IGV (18%) incluido:</span>
                <span class="font-semibold text-on-surface">S/ {{ activo.impuestos.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-base font-black text-on-surface pt-2 border-t border-outline-variant/30">
                <span>Total:</span>
                <span class="text-primary font-display-lg text-lg">S/ {{ activo.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sin sesión de comensal -->
        <div *ngIf="idCliente() === null" class="p-8 rounded-2xl border border-dashed border-outline-variant/60 bg-surface text-center space-y-3">
          <span class="material-symbols-outlined text-4xl text-outline-variant/60">lock</span>
          <h3 class="font-headline-md text-base font-bold text-on-surface">
            {{ auth.isAdmin() ? 'Esta sección es para comensales' : 'Inicia sesión para ver tus pedidos' }}
          </h3>
          <p class="text-xs text-on-surface-variant max-w-sm mx-auto">
            {{ auth.isAdmin() ? 'Gestiona todas las comandas desde el Panel Administrativo.' : 'Ingresa con tu cuenta de cliente para seguir tus órdenes en cocina y revisar tu historial.' }}
          </p>
          <a
            *ngIf="auth.isAdmin()"
            routerLink="/admin/pedidos"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs hover:bg-surface-tint shadow-xs mt-2"
          >
            <span>Ir al Panel Admin</span>
          </a>
          <a
            *ngIf="!auth.isAdmin()"
            routerLink="/login"
            [queryParams]="{ returnUrl: '/mis-pedidos' }"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs hover:bg-surface-tint shadow-xs mt-2"
          >
            <span>Iniciar Sesión</span>
          </a>
        </div>

        <!-- No active order banner -->
        <div *ngIf="idCliente() !== null && !pedidoActivo()" class="p-8 rounded-2xl border border-dashed border-outline-variant/60 bg-surface text-center space-y-3">
          <span class="material-symbols-outlined text-4xl text-outline-variant/60">receipt</span>
          <h3 class="font-headline-md text-base font-bold text-on-surface">No tienes ningún pedido activo en este momento</h3>
          <p class="text-xs text-on-surface-variant max-w-sm mx-auto">
            Todos tus pedidos anteriores han sido entregados con éxito o aún no has ordenado hoy.
          </p>
          <a
            routerLink="/carta"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs hover:bg-surface-tint shadow-xs mt-2"
          >
            <span>Ver Carta y Ordenar</span>
          </a>
        </div>

        <!-- HISTORIAL DE PEDIDOS -->
        <div *ngIf="idCliente() !== null" class="space-y-4 pt-4">
          <div class="flex items-center justify-between">
            <h2 class="font-display-lg text-xl font-bold text-on-surface">Historial de Pedidos Anteriores</h2>
            <span class="text-xs text-on-surface-variant font-medium">
              {{ pedidosHistorial().length }} pedidos registrados
            </span>
          </div>

          <div class="space-y-3">
            <div
              *ngFor="let p of pedidosHistorial()"
              class="p-4 sm:p-5 rounded-2xl border border-outline-variant/40 bg-surface shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-on-surface">{{ p.codigo }}</span>
                  <span class="text-xs text-on-surface-variant">• {{ p.fecha_pedido }} {{ p.hora_pedido }}</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [ngClass]="p.estado === 'entregado' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'"
                  >
                    {{ p.estado === 'entregado' ? '✓ Entregado' : 'Cancelado' }}
                  </span>
                </div>

                <p class="text-xs text-on-surface font-medium">
                  <span *ngFor="let det of p.detalles; let last = last">
                    {{ det.cantidad }}x {{ det.nombre_producto }}{{ !last ? ', ' : '' }}
                  </span>
                </p>

                <p *ngIf="p.mesa" class="text-[11px] text-on-surface-variant">
                  Salón: {{ p.mesa }}
                </p>
                <p *ngIf="p.cliente_direccion" class="text-[11px] text-on-surface-variant truncate max-w-md">
                  Envío a: {{ p.cliente_direccion }}
                </p>
              </div>

              <div class="flex items-center gap-4 shrink-0 sm:border-l sm:border-surface-container sm:pl-5">
                <div class="text-right">
                  <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Total Pagado</span>
                  <span class="font-display-lg text-base font-black text-on-surface">S/ {{ p.total.toFixed(2) }}</span>
                </div>

                <button
                  (click)="repetirPedido(p)"
                  class="px-4 py-2 rounded-xl border border-outline-variant hover:border-primary hover:text-primary text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  title="Clonar platos de este pedido al carrito actual"
                >
                  <span class="material-symbols-outlined text-base">replay</span>
                  <span>Repetir Pedido</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class MisPedidosComponent {
  private pedidosService = inject(PedidosService);
  private cart = inject(CartService);
  private notification = inject(NotificationService);
  private clientesService = inject(ClientesService);
  readonly auth = inject(AuthService);

  /** Id de cliente del comensal autenticado (null si no hay sesión de comensal). */
  readonly idCliente = computed(() => this.clientesService.idClienteDeUsuario(this.auth.currentUser()));

  /** Solo los pedidos del comensal autenticado. */
  readonly pedidos = computed(() => {
    const id = this.idCliente();
    if (id === null) return [];
    return this.pedidosService.pedidos().filter(p => p.id_cliente === id);
  });

  readonly pedidoActivo = computed(() => {
    return this.pedidos().find(p => p.estado === 'pendiente' || p.estado === 'en_preparacion') || null;
  });

  readonly pedidosHistorial = computed(() => {
    return this.pedidos().filter(p => p.estado === 'entregado' || p.estado === 'cancelado');
  });

  constructor() {}

  repetirPedido(pedido: Pedido): void {
    // Add all items of this past order to cart
    for (const det of pedido.detalles) {
      this.cart.addItem({
        id_producto: det.id_producto,
        nombre: det.nombre_producto,
        precio: det.precio_unitario,
        descripcion: '',
        stock: 50,
        id_categoria: 1,
        categoria_nombre: 'Plato',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80'
      }, det.cantidad, det.notas_especiales);
    }
    this.notification.success(
      'Platos Agregados',
      `Se añadieron los artículos del pedido ${pedido.codigo} a tu carrito.`
    );
  }
}
