import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';
import { CartService } from '../../services/cart.service';
import { VoiceAiService } from '../../services/voice-ai.service';
import { NotificationService } from '../../services/notification.service';
import { Producto } from '../../models/producto.model';
import { filtrarProductos } from '../../utils/filtros.util';

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-background pb-20">
      
      <!-- HEADER BANNER -->
      <div class="bg-surface border-b border-outline-variant/30 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-primary">Nuestra Oferta Gastronómica</span>
              <span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-black">
                Wok Hei en Vivo
              </span>
            </div>
            <h1 class="font-display-lg text-3xl font-black text-on-surface tracking-tight mt-1">
              Carta Completa Chifa Wok
            </h1>
            <p class="text-xs text-on-surface-variant mt-1">
              Selecciona tus platillos o activa a Mei para pedir con la voz.
            </p>
          </div>

          <!-- Live Search Bar -->
          <div class="relative w-full md:w-80">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Buscar chaufa, tallarín, wantán..."
              aria-label="Buscar platos en la carta"
              class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden bg-surface-container-low text-xs sm:text-sm font-medium"
            />
            <button
              *ngIf="searchTerm()"
              type="button"
              (click)="searchTerm.set('')"
              aria-label="Limpiar búsqueda"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- CATEGORY TABS -->
      <div class="sticky top-20 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8 py-3">
        <div class="max-w-[1440px] mx-auto flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
          
          <button
            (click)="selectedCategoriaId.set(null)"
            class="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0"
            [ngClass]="selectedCategoriaId() === null ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
          >
            <span class="material-symbols-outlined text-base">restaurant</span>
            <span>Todos los Platos ({{ productosService.totalActivos() }})</span>
          </button>

          <button
            *ngFor="let cat of productosService.categorias()"
            (click)="selectedCategoriaId.set(cat.id_categoria)"
            class="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0"
            [ngClass]="selectedCategoriaId() === cat.id_categoria ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
          >
            <span class="material-symbols-outlined text-base">{{ cat.icono }}</span>
            <span>{{ cat.nombre }}</span>
          </button>

        </div>
      </div>

      <!-- MAIN CATALOG GRID -->
      <main class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Results stats -->
        <div class="flex items-center justify-between mb-6">
          <p class="text-xs text-on-surface-variant font-medium">
            Mostrando <strong>{{ filteredProductos().length }}</strong> platillos disponibles
          </p>
          <button
            (click)="voice.openModal()"
            class="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-tertiary hover:underline"
          >
            <span class="material-symbols-outlined text-base">mic</span>
            ¿Prefieres dictar? Pídele a Mei
          </button>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredProductos().length === 0" class="p-12 text-center rounded-2xl bg-surface border border-outline-variant/30 my-8">
          <span class="material-symbols-outlined text-6xl text-outline-variant/50 mb-3">search_off</span>
          <h3 class="font-headline-md text-lg font-bold text-on-surface">
            {{ searchTerm().trim() ? 'No encontramos platos con "' + searchTerm().trim() + '"' : 'No hay platos disponibles en esta categoría' }}
          </h3>
          <p class="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
            Prueba buscando con palabras como "chaufa", "pollo", "wantán" o borra el filtro para ver toda la carta.
          </p>
          <button
            type="button"
            (click)="searchTerm.set(''); selectedCategoriaId.set(null)"
            class="mt-4 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-surface-tint"
          >
            Restablecer Filtros
          </button>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            *ngFor="let prod of filteredProductos()"
            class="rounded-2xl border border-outline-variant/40 bg-surface overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
          >
            <!-- Product Image -->
            <div class="relative h-48 overflow-hidden bg-surface-container">
              <img
                [src]="prod.imagen"
                [alt]="prod.nombre"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-black text-xs shadow-xs">
                S/ {{ prod.precio.toFixed(2) }}
              </span>
              <span *ngIf="prod.porciones" class="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                {{ prod.porciones }}
              </span>
            </div>

            <!-- Content -->
            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-secondary">
                  {{ prod.categoria_nombre }}
                </span>
                <h3 class="font-headline-md text-base font-bold text-on-surface mt-0.5 group-hover:text-primary transition-colors">
                  {{ prod.nombre }}
                </h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                  {{ prod.descripcion }}
                </p>
              </div>

              <!-- Action button -->
              <div class="pt-2 border-t border-surface-container flex items-center justify-between gap-2">
                <span class="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">timer</span>
                  ~{{ prod.tiempo_preparacion_min || 8 }} min
                </span>

                <button
                  (click)="agregar(prod)"
                  class="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-surface-tint shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-base">add_shopping_cart</span>
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      <!-- FLOATING VOICE BUTTON (Fixed Bottom Right matching Stitch) -->
      <button
        (click)="voice.openModal()"
        title="Hablar con el Asistente de Voz Mei"
        class="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-tertiary-container to-tertiary text-on-tertiary shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 group"
      >
        <span class="material-symbols-outlined text-3xl group-hover:animate-pulse">mic</span>
        <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-ping"></span>
      </button>

    </div>
  `
})
export class CartaComponent {
  readonly searchTerm = signal<string>('');
  readonly selectedCategoriaId = signal<number | null>(null);

  readonly filteredProductos = computed(() =>
    filtrarProductos(this.productosService.productosActivos(), this.selectedCategoriaId(), this.searchTerm())
  );

  constructor(
    public productosService: ProductosService,
    private cart: CartService,
    public voice: VoiceAiService,
    private notification: NotificationService
  ) {}

  agregar(prod: Producto): void {
    this.cart.addItem(prod, 1);
    this.notification.success('Plato Agregado', `${prod.nombre} añadido a tu pedido.`);
  }
}
