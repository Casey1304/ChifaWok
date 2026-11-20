import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { ClientesService } from '../../services/clientes.service';
import { NotificationService } from '../../services/notification.service';
import { Cliente } from '../../models/cliente.model';
import { descargarCsv } from '../../utils/csv.util';
import { coincideBusqueda } from '../../utils/texto.util';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  template: `
    <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      <app-admin-sidebar></app-admin-sidebar>

      <main class="flex-1 min-h-0 min-w-0 flex flex-col lg:h-screen overflow-y-auto bg-background custom-scroll">
        
        <!-- Header -->
        <header class="bg-surface border-b border-outline-variant/30 px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-20 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-primary">CRM & Fidelización</span>
              <h1 class="font-display-lg text-2xl font-black text-on-surface mt-0.5">
                Clientes y Fidelización
              </h1>
            </div>

            <div class="flex items-center gap-3">
              <button
                (click)="exportarDatos()"
                class="px-3.5 py-2 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
              >
                <span class="material-symbols-outlined text-base">file_download</span>
                <span>Exportar CRM</span>
              </button>
            </div>
          </div>
        </header>

        <div class="p-4 sm:p-8 space-y-6 max-w-[1440px] w-full">
          
          <!-- Top KPI Cards (Matches Stitch screen) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Total Clientes</span>
                <span class="font-display-lg text-2xl font-black text-on-surface">{{ clientesService.totalClientes() }}</span>
                <span class="text-[10px] text-on-surface-variant block mt-0.5 font-bold">Registrados en el directorio</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">groups</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Tasa de Recurrencia</span>
                <span class="font-display-lg text-2xl font-black text-on-surface">68.4%</span>
                <span class="text-[10px] text-on-surface-variant block mt-0.5">Clientes habituales</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">autorenew</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Ticket Promedio</span>
                <span class="font-display-lg text-2xl font-black text-on-surface">S/ 54.80</span>
                <span class="text-[10px] text-on-surface-variant block mt-0.5">Por comensal</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">receipt</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Canal Preferido</span>
                <span class="font-display-lg text-2xl font-black text-tertiary">61% Voice AI</span>
                <span class="text-[10px] text-on-surface-variant block mt-0.5">39% Web / App</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-tertiary flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">mic</span>
              </div>
            </div>
          </div>

          <!-- Main Layout: Table + Right Intelligent Profile Drawer -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Customer Directory Table (col-span-2) -->
            <div class="lg:col-span-2 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs p-5 space-y-4">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <!-- Filter Tabs -->
                <div class="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll">
                  <button
                    (click)="filtroNivel.set(null)"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                    [ngClass]="filtroNivel() === null ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
                  >
                    Todos ({{ clientesService.totalClientes() }})
                  </button>
                  <button
                    (click)="filtroNivel.set('Oro VIP')"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                    [ngClass]="filtroNivel() === 'Oro VIP' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
                  >
                    Dragón Dorado VIP ({{ clientesService.clientesVIP().length }})
                  </button>
                  <button
                    (click)="filtroNivel.set('Frecuente')"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                    [ngClass]="filtroNivel() === 'Frecuente' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
                  >
                    Frecuentes ({{ clientesService.clientesFrecuentes().length }})
                  </button>
                  <button
                    (click)="filtroNivel.set('Nuevo')"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                    [ngClass]="filtroNivel() === 'Nuevo' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
                  >
                    Nuevos ({{ clientesService.clientesNuevos().length }})
                  </button>
                </div>

                <!-- Search -->
                <div class="relative w-full sm:w-60">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                  <input
                    type="text"
                    [ngModel]="search()"
                    (ngModelChange)="search.set($event)"
                    placeholder="Buscar cliente..."
                    aria-label="Buscar clientes"
                    class="w-full pl-9 pr-9 py-1.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-hidden text-xs bg-surface"
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

              <!-- TABLE -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="border-b border-surface-container text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                      <th class="py-3 px-3">Cliente / Contacto</th>
                      <th class="py-3 px-3">Historial</th>
                      <th class="py-3 px-3">Canal Habitual</th>
                      <th class="py-3 px-3">Plato Favorito</th>
                      <th class="py-3 px-3">Último Pedido</th>
                      <th class="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-surface-container/60">
                    <tr
                      *ngFor="let c of clientesFiltrados()"
                      (click)="seleccionarCliente(c)"
                      class="hover:bg-surface-container-low transition-colors cursor-pointer"
                      [ngClass]="clienteSeleccionado()?.id_cliente === c.id_cliente ? 'bg-primary/5' : ''"
                    >
                      <!-- Contact Info -->
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2.5">
                          <div
                            class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            [ngClass]="c.nivel === 'Oro VIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-surface-container text-on-surface'"
                          >
                            {{ c.nombre.charAt(0) }}{{ c.apellido.charAt(0) }}
                          </div>
                          <div>
                            <p class="font-bold text-on-surface">{{ c.nombre }} {{ c.apellido }}</p>
                            <span class="text-[10px] text-on-surface-variant">{{ c.telefono }} • {{ c.distrito }}</span>
                          </div>
                        </div>
                      </td>

                      <!-- Historial -->
                      <td class="py-3 px-3">
                        <span class="font-bold text-on-surface block">{{ c.pedidos_totales }} pedidos</span>
                        <span class="text-[10px] text-on-surface-variant">S/ {{ c.gasto_total.toFixed(2) }}</span>
                      </td>

                      <!-- Canal Habitual -->
                      <td class="py-3 px-3">
                        <span
                          class="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit"
                          [ngClass]="c.canal_habitual === 'Voice AI' ? 'bg-tertiary-fixed text-on-tertiary-fixed font-black' : 'bg-surface-container text-on-surface-variant'"
                        >
                          <span class="material-symbols-outlined text-xs">{{ c.canal_habitual === 'Voice AI' ? 'mic' : 'language' }}</span>
                          {{ c.canal_habitual }}
                        </span>
                      </td>

                      <!-- Plato Favorito -->
                      <td class="py-3 px-3 font-medium text-on-surface truncate max-w-[140px]">
                        {{ c.plato_favorito }}
                      </td>

                      <!-- Último Pedido -->
                      <td class="py-3 px-3 text-[11px] text-on-surface-variant">
                        {{ c.ultimo_pedido }}
                      </td>

                      <!-- Acciones -->
                      <td class="py-3 px-3 text-right">
                        <button
                          (click)="seleccionarCliente(c); $event.stopPropagation()"
                          class="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-bold hover:bg-surface-container transition-colors"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="clientesFiltrados().length === 0">
                      <td colspan="6" class="py-10 px-3 text-center text-xs text-on-surface-variant italic">
                        No se encontraron clientes con los filtros aplicados.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <!-- FICHA DE PERFIL INTELIGENTE (Matches Stitch screen) -->
            <div *ngIf="clienteSeleccionado() as c" class="rounded-2xl bg-surface border border-outline-variant/40 shadow-xs p-6 space-y-5 animate-[fadeInRight_0.2s_ease-out]">
              
              <div class="flex items-center justify-between pb-3 border-b border-surface-container">
                <span class="text-[10px] font-black uppercase tracking-wider text-primary">Ficha de Perfil Inteligente</span>
                <span class="font-mono text-xs font-bold text-on-surface-variant">#CW-{{ c.id_cliente }}</span>
              </div>

              <!-- Avatar & Points -->
              <div class="flex flex-col items-center text-center space-y-2">
                <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-display-lg text-xl font-black shadow-md border-2 border-amber-300">
                  {{ c.nombre.charAt(0) }}{{ c.apellido.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-display-lg text-base font-black text-on-surface">{{ c.nombre }} {{ c.apellido }}</h3>
                  <p class="text-xs text-on-surface-variant">{{ c.email }}</p>
                  <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                    ★ {{ c.nivel }}
                  </span>
                </div>
              </div>

              <!-- Andean Dragon Loyalty Points -->
              <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-on-surface">Puntos Andean Dragon</span>
                  <span class="font-display-lg text-sm font-black text-secondary">{{ c.puntos_dragon }} pts</span>
                </div>
                <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div class="bg-secondary-container h-full rounded-full" [style.width]="(c.puntos_dragon / 15) + '%'"></div>
                </div>
                <p class="text-[10px] text-on-surface-variant text-right">
                  Próximo premio: Wantán Imperial (Faltan 80 pts)
                </p>
              </div>

              <!-- Habitual Delivery & Contact -->
              <div class="space-y-2 text-xs">
                <p class="font-bold text-[11px] uppercase tracking-wider text-on-surface-variant">Contacto & Entrega Habitual</p>
                <div class="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                  <p class="text-on-surface font-semibold flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-primary">phone</span>
                    {{ c.telefono }}
                  </p>
                  <p class="text-on-surface-variant text-[11px] flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-secondary">location_on</span>
                    {{ c.direccion }}, {{ c.distrito }}
                  </p>
                </div>
              </div>

              <!-- Voice AI Learned Profile -->
              <div *ngIf="c.perfil_voz as pv" class="space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[11px] uppercase tracking-wider text-tertiary">Perfil Fonético & Voice AI</span>
                  <span class="px-2 py-0.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-black">
                    Auto-capturado
                  </span>
                </div>

                <div class="p-3.5 rounded-xl bg-tertiary-fixed/20 border border-tertiary-fixed-dim/40 space-y-2">
                  <div>
                    <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Acento / Jerga detectada</span>
                    <span class="font-bold text-on-surface text-xs">{{ pv.acento_detectado }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Preferencias Culinarias Aprendidas</span>
                    <span class="text-xs text-on-surface italic leading-snug">"{{ pv.preferencias_culinarias }}"</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Horario Habitual</span>
                    <span class="text-xs text-on-surface">{{ pv.horario_habitual }}</span>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="pt-2 flex flex-col gap-2">
                <button
                  (click)="enviarCupon(c)"
                  class="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-surface-tint shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-base">loyalty</span>
                  <span>Enviar Cupón Descuento</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  `
})
export class AdminClientesComponent {
  readonly search = signal<string>('');
  readonly filtroNivel = signal<string | null>(null);
  readonly clienteSeleccionado = signal<Cliente | null>(null);

  readonly clientesFiltrados = computed(() => {
    let list = this.clientesService.clientes();

    const nivel = this.filtroNivel();
    if (nivel) {
      list = list.filter(c => c.nivel === nivel);
    }

    const term = this.search();
    if (term.trim()) {
      list = list.filter(c => coincideBusqueda(term, [
        `${c.nombre} ${c.apellido}`,
        c.email,
        c.telefono,
        c.distrito,
        c.direccion,
        c.plato_favorito
      ]));
    }

    return list;
  });

  constructor(
    public clientesService: ClientesService,
    private notification: NotificationService
  ) {
    // Select first customer by default
    const first = this.clientesService.clientes()[0];
    if (first) {
      this.clienteSeleccionado.set(first);
    }
  }

  seleccionarCliente(c: Cliente): void {
    this.clienteSeleccionado.set(c);
  }

  /** Exporta a CSV los clientes visibles (respeta búsqueda y filtro de nivel). */
  exportarDatos(): void {
    const lista = this.clientesFiltrados();
    if (lista.length === 0) {
      this.notification.warning('Sin datos', 'No hay clientes con los filtros actuales.');
      return;
    }
    descargarCsv(`chifawok-clientes-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Distrito', 'Dirección', 'Nivel', 'Pedidos', 'Gasto total (S/)', 'Canal habitual', 'Plato favorito', 'Puntos'],
      ...lista.map(c => [
        c.nombre, c.apellido, c.email, c.telefono, c.distrito, c.direccion, c.nivel,
        c.pedidos_totales, c.gasto_total.toFixed(2), c.canal_habitual, c.plato_favorito, c.puntos_dragon
      ])
    ]);
    this.notification.success('Exportación Exitosa', `${lista.length} clientes exportados a CSV.`);
  }

  /** Genera un código de cupón para compartir manualmente (no hay pasarela de SMS/WhatsApp integrada). */
  enviarCupon(c: Cliente): void {
    const codigo = `WOK15-${c.id_cliente.toString().slice(-4)}`;
    this.notification.info(
      'Cupón generado',
      `Código ${codigo} (15%) para ${c.nombre}. Compártelo con el cliente: el envío por SMS/WhatsApp no está integrado.`
    );
  }
}
