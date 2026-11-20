import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { ProductosService } from '../../services/productos.service';
import { NotificationService } from '../../services/notification.service';
import { Producto } from '../../models/producto.model';
import { coincideBusqueda } from '../../utils/texto.util';

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminSidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <app-admin-sidebar></app-admin-sidebar>

      <main class="flex-1 flex flex-col h-screen overflow-y-auto bg-background custom-scroll">
        
        <!-- Header -->
        <header class="bg-surface border-b border-outline-variant/30 px-8 py-5 sticky top-0 z-20 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-primary">Gestión de Catálogo al Wok</span>
              <h1 class="font-display-lg text-2xl font-black text-on-surface mt-0.5">
                Gestión de Productos y Carta
              </h1>
            </div>

            <div class="flex items-center gap-3">
              <button
                (click)="abrirModalNuevo()"
                class="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-surface-tint transition-all flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-base">add</span>
                <span>Nuevo Plato</span>
              </button>
            </div>
          </div>
        </header>

        <div class="p-8 space-y-6 max-w-[1440px] w-full">
          
          <!-- KPI Stats Bar (Matches Stitch screen) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Total Platos</span>
                <span class="font-display-lg text-2xl font-black text-on-surface">{{ productosService.totalPlatos() }}</span>
                <span class="text-[10px] text-on-surface-variant block mt-0.5">5 categorías activas</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">restaurant_menu</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Activos en Carta</span>
                <span class="font-display-lg text-2xl font-black text-emerald-700">{{ productosService.totalActivos() }}</span>
                <span class="text-[10px] text-emerald-700 block mt-0.5">100% disponibilidad</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">check_circle</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Pausados / Agotados</span>
                <span class="font-display-lg text-2xl font-black text-amber-700">{{ productosService.totalPausados() }}</span>
                <span class="text-[10px] text-amber-700 block mt-0.5">Insumos por reponer</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">pause_circle</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-secondary block">Más Vendido</span>
                <span class="font-display-lg text-base font-black text-on-surface truncate block max-w-[150px]">Chaufa Especial</span>
                <span class="text-[10px] text-on-surface-variant block mt-0.5">412 porciones este mes</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">stars</span>
              </div>
            </div>
          </div>

          <!-- Controls: Category Filters & Search -->
          <div class="p-5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <!-- Category Tabs -->
              <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
                <button
                  (click)="filtroCategoria.set(null)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                  [ngClass]="filtroCategoria() === null ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
                >
                  Todos ({{ productosService.totalPlatos() }})
                </button>
                <button
                  *ngFor="let cat of productosService.categorias()"
                  (click)="filtroCategoria.set(cat.id_categoria)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                  [ngClass]="filtroCategoria() === cat.id_categoria ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
                >
                  {{ cat.nombre }}
                </button>
              </div>

              <!-- Search -->
              <div class="relative w-full md:w-72">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                <input
                  type="text"
                  [ngModel]="search()"
                  (ngModelChange)="search.set($event)"
                  placeholder="Buscar plato, insumo o comando de voz..."
                  aria-label="Buscar productos"
                  class="w-full pl-9 pr-9 py-2 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs bg-surface"
                />
                <button
                  *ngIf="search()"
                  type="button"
                  (click)="search.set('')"
                  aria-label="Limpiar búsqueda"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

            </div>

            <!-- TABLE OF PRODUCTS -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-surface-container text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                    <th class="py-3 px-3">Plato & Categoría</th>
                    <th class="py-3 px-3">Precio</th>
                    <th class="py-3 px-3">Estado en Carta</th>
                    <th class="py-3 px-3">Ventas Mes</th>
                    <th class="py-3 px-3">Parámetros Voice AI</th>
                    <th class="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-container/60">
                  <tr *ngFor="let p of productosFiltrados()" class="hover:bg-surface-container-low transition-colors">
                    
                    <!-- Plato Info -->
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-3">
                        <img [src]="p.imagen" [alt]="p.nombre" class="w-12 h-12 rounded-lg object-cover border border-surface-container shrink-0" />
                        <div>
                          <p class="font-bold text-on-surface text-sm">{{ p.nombre }}</p>
                          <span class="text-[10px] text-secondary font-bold uppercase tracking-wider">{{ p.categoria_nombre }}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Precio -->
                    <td class="py-3 px-3 font-display-lg text-sm font-black text-on-surface">
                      S/ {{ p.precio.toFixed(2) }}
                    </td>

                    <!-- Estado Toggle -->
                    <td class="py-3 px-3">
                      <button
                        (click)="toggleEstado(p)"
                        class="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
                        [ngClass]="p.disponible ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-amber-50 text-amber-800 border border-amber-300'"
                        title="Clic para cambiar disponibilidad en carta"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="p.disponible ? 'bg-emerald-600' : 'bg-amber-600'"></span>
                        <span>{{ p.disponible ? 'En Carta' : 'Agotado (Pausado)' }}</span>
                      </button>
                    </td>

                    <!-- Ventas Mes -->
                    <td class="py-3 px-3 font-mono font-semibold text-on-surface">
                      {{ p.ventas_mes || 0 }} ped.
                    </td>

                    <!-- Sinónimos Voice AI -->
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-tertiary text-base">record_voice_over</span>
                        <span class="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                          {{ (p.sinonimos_voz || []).slice(0, 2).join(', ') || 'Fonética estándar' }}
                        </span>
                      </div>
                    </td>

                    <!-- Acciones -->
                    <td class="py-3 px-3 text-right">
                      <div class="inline-flex items-center gap-1">
                        <button
                          (click)="editar(p)"
                          class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container"
                          title="Editar plato"
                        >
                          <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          (click)="eliminar(p)"
                          class="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50"
                          title="Eliminar plato"
                        >
                          <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                  <tr *ngIf="productosFiltrados().length === 0">
                    <td colspan="6" class="py-10 px-3 text-center text-xs text-on-surface-variant italic">
                      No se encontraron platos con los filtros aplicados.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>

      <!-- DRAWER / MODAL FOR ADD / EDIT PRODUCT & VOICE CONFIG -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div (click)="showModal = false" class="absolute inset-0 bg-black/40 backdrop-blur-xs"></div>
        <div class="relative w-full max-w-xl p-6 rounded-3xl bg-surface shadow-2xl border border-outline-variant/40 space-y-4 max-h-[90vh] overflow-y-auto custom-scroll">
          
          <div class="flex items-center justify-between pb-3 border-b border-surface-container">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-2xl">restaurant</span>
              <h3 class="font-headline-md text-lg font-bold text-on-surface">
                {{ platoSeleccionado ? 'Editar Plato en Carta' : 'Registrar Nuevo Plato al Wok' }}
              </h3>
            </div>
            <button (click)="showModal = false" class="text-on-surface-variant hover:text-on-surface p-1 rounded-full">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form [formGroup]="productoForm" (ngSubmit)="guardarProducto()" class="space-y-4 text-xs">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombre -->
              <div class="space-y-1">
                <label class="block font-bold text-on-surface">Nombre del Plato</label>
                <input
                  type="text"
                  formControlName="nombre"
                  placeholder="Ej: Lomo Saltado Chifero"
                  class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
                />
              </div>

              <!-- Categoría -->
              <div class="space-y-1">
                <label class="block font-bold text-on-surface">Categoría</label>
                <select formControlName="id_categoria" class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface">
                  <option *ngFor="let c of productosService.categorias()" [value]="c.id_categoria">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Precio -->
              <div class="space-y-1">
                <label class="block font-bold text-on-surface">Precio (S/)</label>
                <input
                  type="number"
                  step="0.50"
                  formControlName="precio"
                  class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
                />
              </div>

              <!-- Stock -->
              <div class="space-y-1">
                <label class="block font-bold text-on-surface">Stock Diario</label>
                <input
                  type="number"
                  formControlName="stock"
                  class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
                />
              </div>

              <!-- Tiempo -->
              <div class="space-y-1">
                <label class="block font-bold text-on-surface">Tiempo Prep (min)</label>
                <input
                  type="number"
                  formControlName="tiempo_preparacion_min"
                  class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
                />
              </div>
            </div>

            <!-- Porciones -->
            <div class="space-y-1">
              <label class="block font-bold text-on-surface">Porciones / Tamaño</label>
              <input
                type="text"
                formControlName="porciones"
                placeholder="Ej: Familiar (2 a 3 comensales)"
                class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
              />
            </div>

            <!-- Imagen URL -->
            <div class="space-y-1">
              <label class="block font-bold text-on-surface">URL Fotografía Gastronómica</label>
              <input
                type="text"
                formControlName="imagen"
                placeholder="https://..."
                class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
              />
            </div>

            <!-- Descripción -->
            <div class="space-y-1">
              <label class="block font-bold text-on-surface">Descripción Culinaria</label>
              <textarea
                rows="2"
                formControlName="descripcion"
                placeholder="Ingredientes, técnica de wok y notas de sabor..."
                class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface"
              ></textarea>
            </div>

            <!-- PARÁMETROS FONÉTICOS VOICE AI -->
            <div class="p-4 rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed-dim/40 space-y-2">
              <div class="flex items-center gap-1.5 text-tertiary">
                <span class="material-symbols-outlined text-lg">psychology</span>
                <span class="font-bold uppercase tracking-wider text-[11px]">Parámetros Fonéticos para Mei</span>
              </div>
              <p class="text-[11px] text-on-surface-variant">
                Ingresa cómo suelen nombrar este plato los comensales (separados por comas) para que la IA lo reconozca por voz:
              </p>
              <input
                type="text"
                formControlName="sinonimos_voz"
                placeholder="ej: chaufa mixto, chaufa con todo, arroz chaufa"
                class="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface text-xs"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                (click)="showModal = false"
                class="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="productoForm.invalid"
                class="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-surface-tint shadow-xs disabled:opacity-50"
              >
                Guardar Plato
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  `
})
export class AdminProductosComponent {
  readonly search = signal<string>('');
  readonly filtroCategoria = signal<number | null>(null);

  showModal = false;
  platoSeleccionado: Producto | null = null;
  productoForm: FormGroup;

  readonly productosFiltrados = computed(() => {
    let list = this.productosService.productos();

    const catId = this.filtroCategoria();
    if (catId !== null) {
      list = list.filter(p => p.id_categoria === catId);
    }

    const term = this.search();
    if (term.trim()) {
      list = list.filter(p => coincideBusqueda(term, [
        p.nombre,
        p.categoria_nombre,
        p.descripcion,
        p.porciones,
        ...(p.sinonimos_voz || [])
      ]));
    }

    return list;
  });

  constructor(
    public productosService: ProductosService,
    private fb: FormBuilder,
    private notification: NotificationService
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      id_categoria: [1, Validators.required],
      precio: [30.00, [Validators.required, Validators.min(1)]],
      stock: [30, [Validators.required, Validators.min(0)]],
      porciones: ['Individual generoso', Validators.required],
      tiempo_preparacion_min: [8, Validators.required],
      imagen: ['https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', Validators.required],
      descripcion: ['', Validators.required],
      sinonimos_voz: ['']
    });
  }

  toggleEstado(prod: Producto): void {
    this.productosService.toggleDisponibilidad(prod.id_producto);
    this.notification.info(
      'Disponibilidad Actualizada',
      `${prod.nombre} ahora está ${!prod.disponible ? 'En Carta' : 'Pausado/Agotado'}.`
    );
  }

  abrirModalNuevo(): void {
    this.platoSeleccionado = null;
    this.productoForm.reset({
      nombre: '',
      id_categoria: 1,
      precio: 30.00,
      stock: 30,
      porciones: 'Individual generoso',
      tiempo_preparacion_min: 8,
      imagen: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
      descripcion: '',
      sinonimos_voz: ''
    });
    this.showModal = true;
  }

  editar(prod: Producto): void {
    this.platoSeleccionado = prod;
    this.productoForm.patchValue({
      nombre: prod.nombre,
      id_categoria: prod.id_categoria,
      precio: prod.precio,
      stock: prod.stock,
      porciones: prod.porciones || 'Individual',
      tiempo_preparacion_min: prod.tiempo_preparacion_min || 8,
      imagen: prod.imagen,
      descripcion: prod.descripcion,
      sinonimos_voz: (prod.sinonimos_voz || []).join(', ')
    });
    this.showModal = true;
  }

  eliminar(prod: Producto): void {
    if (confirm(`¿Estás seguro de eliminar "${prod.nombre}" de la carta?`)) {
      this.productosService.eliminarProducto(prod.id_producto);
      this.notification.warning('Plato Eliminado', `${prod.nombre} fue removido de la carta.`);
    }
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) return;

    const val = this.productoForm.value;
    const cat = this.productosService.categorias().find(c => c.id_categoria === +val.id_categoria);

    const sinonimosArr = typeof val.sinonimos_voz === 'string'
      ? val.sinonimos_voz.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    if (this.platoSeleccionado) {
      this.productosService.actualizarProducto(this.platoSeleccionado.id_producto, {
        nombre: val.nombre,
        id_categoria: +val.id_categoria,
        categoria_nombre: cat?.nombre || 'Especialidades',
        precio: +val.precio,
        stock: +val.stock,
        porciones: val.porciones,
        tiempo_preparacion_min: +val.tiempo_preparacion_min,
        imagen: val.imagen,
        descripcion: val.descripcion,
        sinonimos_voz: sinonimosArr
      });
      this.notification.success('Plato Actualizado', `${val.nombre} guardado en la carta.`);
    } else {
      this.productosService.crearProducto({
        nombre: val.nombre,
        id_categoria: +val.id_categoria,
        categoria_nombre: cat?.nombre || 'Especialidades',
        precio: +val.precio,
        stock: +val.stock,
        disponible: true,
        porciones: val.porciones,
        tiempo_preparacion_min: +val.tiempo_preparacion_min,
        imagen: val.imagen,
        descripcion: val.descripcion,
        sinonimos_voz: sinonimosArr
      });
      this.notification.success('Plato Creado', `${val.nombre} agregado a la carta.`);
    }

    this.showModal = false;
  }
}
