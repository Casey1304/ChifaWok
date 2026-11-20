import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { PedidosService } from '../../services/pedidos.service';
import { AuthService } from '../../services/auth.service';
import { ClientesService } from '../../services/clientes.service';
import { NotificationService } from '../../services/notification.service';
import { TipoEntrega } from '../../models/pedido.model';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-hidden">
      <!-- Backdrop -->
      <div
        (click)="closeDrawer.emit()"
        class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      ></div>

      <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div class="w-screen max-w-md bg-surface shadow-2xl flex flex-col justify-between animate-[fadeInRight_0.3s_ease-out]">
          
          <!-- Drawer Header -->
          <div class="p-5 border-b border-surface-container flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
              <h2 class="font-headline-md text-lg font-bold text-on-surface">Tu Pedido Chifero</h2>
              <span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                {{ cart.totalCount() }} items
              </span>
            </div>
            <button
              (click)="closeDrawer.emit()"
              class="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Drawer Body: Cart Items List -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scroll">
            <div *ngIf="cart.items().length === 0" class="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <span class="material-symbols-outlined text-6xl text-outline-variant/60 mb-3">soup_kitchen</span>
              <p class="font-headline-md text-base font-bold text-on-surface">Tu wok está vacío</p>
              <p class="text-xs text-on-surface-variant mt-1 max-w-xs">
                Explora nuestra carta tradicional o pídele a Mei por voz que agregue tus platos favoritos.
              </p>
            </div>

            <div
              *ngFor="let item of cart.items()"
              class="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs flex items-center gap-3"
            >
              <img
                [src]="item.producto.imagen"
                [alt]="item.producto.nombre"
                class="w-16 h-16 rounded-lg object-cover shrink-0 border border-surface-container"
              />
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm text-on-surface truncate">{{ item.producto.nombre }}</h4>
                <p class="text-xs font-bold text-primary">S/ {{ item.producto.precio.toFixed(2) }}</p>
                <p *ngIf="item.notas_especiales" class="text-[11px] text-amber-700 italic truncate mt-0.5">
                  Nota: {{ item.notas_especiales }}
                </p>

                <!-- Quantity Controller -->
                <div class="flex items-center gap-2 mt-2">
                  <button
                    (click)="cart.updateQuantity(item.producto.id_producto, -1)"
                    class="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    -
                  </button>
                  <span class="text-xs font-bold px-1.5">{{ item.cantidad }}</span>
                  <button
                    (click)="cart.updateQuantity(item.producto.id_producto, 1)"
                    class="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="font-bold text-sm text-on-surface">S/ {{ item.subtotal.toFixed(2) }}</span>
                <button
                  (click)="cart.removeItem(item.producto.id_producto)"
                  class="block mt-2 text-on-surface-variant hover:text-red-600 p-1 transition-colors"
                  title="Eliminar del pedido"
                >
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>

            <!-- Delivery & Contact Details -->
            <div *ngIf="cart.items().length > 0" class="pt-4 border-t border-surface-container space-y-3">
              <h3 class="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Modalidad de Pedido</h3>
              
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="tipoEntrega.set('delivery')"
                  [ngClass]="tipoEntrega() === 'delivery' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-surface-container text-on-surface border-transparent'"
                  class="p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all"
                >
                  <span class="material-symbols-outlined text-lg">delivery_dining</span>
                  Delivery
                </button>
                <button
                  type="button"
                  (click)="tipoEntrega.set('recojo')"
                  [ngClass]="tipoEntrega() === 'recojo' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-surface-container text-on-surface border-transparent'"
                  class="p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all"
                >
                  <span class="material-symbols-outlined text-lg">takeout_dining</span>
                  Para Llevar
                </button>
                <button
                  type="button"
                  (click)="tipoEntrega.set('salon')"
                  [ngClass]="tipoEntrega() === 'salon' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-surface-container text-on-surface border-transparent'"
                  class="p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all"
                >
                  <span class="material-symbols-outlined text-lg">table_restaurant</span>
                  En Salón
                </button>
              </div>

              <!-- Conditional Fields -->
              <div *ngIf="tipoEntrega() === 'delivery'" class="space-y-2">
                <label class="block text-xs font-semibold text-on-surface">Dirección de Entrega</label>
                <input
                  type="text"
                  [(ngModel)]="direccionEntrega"
                  placeholder="Ej: Av. Pardo 450 Dpto 602, Miraflores"
                  class="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-hidden bg-surface"
                />
              </div>

              <div *ngIf="tipoEntrega() === 'salon'" class="space-y-2">
                <label class="block text-xs font-semibold text-on-surface">Número de Mesa</label>
                <input
                  type="text"
                  [(ngModel)]="numeroMesa"
                  placeholder="Ej: Mesa 4"
                  class="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-hidden bg-surface"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-semibold text-on-surface">Instrucciones o Modificadores</label>
                <input
                  type="text"
                  [(ngModel)]="notasPedido"
                  placeholder="Ej: Sin cebollita china, bien taipá, ají aparte..."
                  class="w-full text-xs px-3 py-2 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-hidden bg-surface"
                />
              </div>
            </div>
          </div>

          <!-- Drawer Footer: Totals and Checkout -->
          <div *ngIf="cart.items().length > 0" class="p-5 border-t border-surface-container bg-surface-container-low/50 space-y-3">
            <div class="space-y-1.5 text-xs text-on-surface-variant">
              <div class="flex justify-between">
                <span>Subtotal platos:</span>
                <span class="font-semibold text-on-surface">S/ {{ cart.subtotal().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>IGV (18%):</span>
                <span class="font-semibold text-on-surface">S/ {{ cart.impuestos().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-base font-black text-on-surface pt-2 border-t border-outline-variant/30">
                <span>Total a Pagar:</span>
                <span class="text-primary font-display-lg text-lg">S/ {{ cart.total().toFixed(2) }}</span>
              </div>
            </div>

            <button
              (click)="checkout()"
              [disabled]="isSubmitting()"
              class="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span class="material-symbols-outlined text-lg">check_circle</span>
              <span>{{ isSubmitting() ? 'Enviando al Wok...' : 'Confirmar y Enviar a Cocina' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CartDrawerComponent {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  readonly tipoEntrega = signal<TipoEntrega>('delivery');
  readonly isSubmitting = signal<boolean>(false);

  direccionEntrega = 'Av. Pardo 450, Dpto 602, Miraflores';
  numeroMesa = 'Mesa 4';
  notasPedido = '';

  constructor(
    public cart: CartService,
    private pedidosService: PedidosService,
    private auth: AuthService,
    private clientesService: ClientesService,
    private notification: NotificationService,
    private router: Router
  ) {}

  checkout(): void {
    if (this.cart.items().length === 0 || this.isSubmitting()) return;

    const user = this.auth.currentUser();
    const idCliente = this.clientesService.idClienteDeUsuario(user);
    if (!user || idCliente === null) {
      // Los pedidos pertenecen a un comensal: sin sesión de cliente no se puede asignar el pedido.
      this.notification.warning(
        'Inicia sesión como comensal',
        'Tu carrito se conserva. Ingresa con tu cuenta de cliente para confirmar el pedido.'
      );
      this.closeDrawer.emit();
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.isSubmitting.set(true);

    setTimeout(() => {
      const pedido = this.pedidosService.crearPedido({
        idCliente,
        clienteNombre: `${user.nombre} ${user.apellido}`,
        clienteTelefono: user.telefono || '',
        clienteDireccion: this.tipoEntrega() === 'delivery' ? this.direccionEntrega : undefined,
        tipoEntrega: this.tipoEntrega(),
        mesa: this.tipoEntrega() === 'salon' ? this.numeroMesa : undefined,
        notas: this.notasPedido,
        detalles: this.cart.toDetallesPedido(),
        origen: 'web'
      });

      this.cart.clear();
      this.isSubmitting.set(false);
      this.closeDrawer.emit();

      this.notification.success(
        '¡Pedido Recibido con Éxito!',
        `Tu orden ${pedido.codigo} ya está en la cola del Wok. Estado: Pendiente de preparación.`
      );

      this.router.navigate(['/mis-pedidos']);
    }, 400);
  }
}
