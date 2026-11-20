import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { MetricasService } from '../../services/metricas.service';
import { VoiceAiService } from '../../services/voice-ai.service';
import { NotificationService } from '../../services/notification.service';
import { SesionVoz } from '../../models/sesion-voz.model';
import { PedidosService } from '../../services/pedidos.service';
import { ProductosService } from '../../services/productos.service';
import { Router } from '@angular/router';
import { descargarCsv } from '../../utils/csv.util';

@Component({
  selector: 'app-admin-metricas',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent],
  template: `
    <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      <app-admin-sidebar></app-admin-sidebar>

      <main class="flex-1 min-h-0 min-w-0 flex flex-col lg:h-screen overflow-y-auto bg-background custom-scroll">
        
        <!-- Header (Matches Stitch screen) -->
        <header class="bg-surface border-b border-outline-variant/30 px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-20 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span class="text-xs font-bold uppercase tracking-wider text-primary">Consola de Voice AI & Métricas</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  Live Wok AI
                </span>
              </div>
              <h1 class="font-display-lg text-2xl font-black text-on-surface mt-0.5">
                Monitor Fonético y Rendimiento de Ventas por Voz
              </h1>
            </div>

            <div class="flex items-center gap-3">
              <button
                (click)="descargarReporte()"
                class="px-3.5 py-2 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
              >
                <span class="material-symbols-outlined text-base">download</span>
                <span>Descargar Reporte (CSV)</span>
              </button>
              <button
                (click)="configurarVocabulario()"
                class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-surface-tint shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-base">spellcheck</span>
                <span>Configurar Vocabulario Wok</span>
              </button>
            </div>
          </div>
        </header>

        <div class="p-4 sm:p-8 space-y-6 max-w-[1440px] w-full">
          
          <!-- TOP 4 KPI CARDS (datos calculados de sesiones y pedidos) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Precisión del Reconocimiento</span>
                <span class="material-symbols-outlined text-primary text-lg">graphic_eq</span>
              </div>
              <p class="font-display-lg text-3xl font-black text-on-surface">{{ metricasService.precisionPromedio() }}%</p>
              <span class="text-[10px] text-on-surface-variant font-bold block">
                Confianza media en {{ metricasService.totalSesiones() }} sesiones de voz
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Tiempo Promedio de Orden</span>
                <span class="material-symbols-outlined text-secondary text-lg">timer</span>
              </div>
              <p class="font-display-lg text-3xl font-black text-on-surface">{{ metricasService.duracionPromedio() }} seg</p>
              <span class="text-[10px] text-on-surface-variant font-bold block">
                Desde que Mei empieza a escuchar hasta interpretar
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Conversión a Pedido</span>
                <span class="material-symbols-outlined text-tertiary text-lg">shopping_cart_checkout</span>
              </div>
              <p class="font-display-lg text-3xl font-black text-on-surface">{{ metricasService.tasaConversion() }}%</p>
              <span class="text-[10px] text-on-surface-variant font-bold block">
                {{ metricasService.sesionesConPedido() }} sesiones terminaron en pedido
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Pedidos por Voz</span>
                <span class="material-symbols-outlined text-emerald-600 text-lg">record_voice_over</span>
              </div>
              <div class="flex items-baseline gap-2">
                <p class="font-display-lg text-3xl font-black text-emerald-700">{{ metricasService.pedidosPorVoz() }}</p>
                <span class="text-xs text-on-surface-variant">/ {{ pedidosVigentes() }} pedidos vigentes</span>
              </div>
              <span class="text-[10px] text-on-surface-variant font-medium block">
                Interpretación sin aclaraciones: {{ metricasService.tasaExitoVoiceAI() }}%
              </span>
            </div>
          </div>

          <!-- 2-COLUMN MAIN LAYOUT -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- LEFT 2 COLUMNS: Active Live Call & Transcriptions -->
            <div class="lg:col-span-2 space-y-6">
              
              <!-- ÚLTIMA SESIÓN DE VOZ (dato real más reciente) -->
              <div class="p-5 rounded-2xl bg-surface border-2 border-primary/30 shadow-xs space-y-4">
                <ng-container *ngIf="metricasService.sesiones()[0] as ultima; else sinSesiones">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-3">
                    <div class="flex items-center gap-2.5">
                      <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span class="font-display-lg text-base font-black text-on-surface">Última Sesión de Voz {{ ultima.codigo_llamada }}</span>
                      <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {{ ultima.ubicacion }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-xs">
                      <span class="font-mono font-bold text-primary">{{ ultima.fecha }} {{ ultima.hora }}</span>
                      <span class="text-emerald-700 font-bold">Confianza: {{ ultima.confianza }}%</span>
                    </div>
                  </div>

                  <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
                    <div class="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span class="flex items-center gap-1 font-semibold">
                        <span class="material-symbols-outlined text-xs text-primary">person</span>
                        {{ ultima.cliente_nombre }}
                      </span>
                      <span class="font-mono font-bold" [ngClass]="ultima.pedido_asociado_codigo ? 'text-emerald-700' : 'text-amber-700'">
                        {{ ultima.pedido_asociado_codigo ? 'PEDIDO ' + ultima.pedido_asociado_codigo : (ultima.exitosa ? 'SIN CONFIRMAR' : 'ACLARACIÓN') }}
                      </span>
                    </div>
                    <p class="text-xs text-on-surface font-medium italic leading-relaxed">
                      <strong>Comensal:</strong> "{{ ultima.transcripcion_usuario }}"
                    </p>
                    <p class="text-xs text-on-surface-variant leading-relaxed">
                      <strong>Mei:</strong> {{ ultima.respuesta_mei }}
                    </p>
                  </div>
                </ng-container>
                <ng-template #sinSesiones>
                  <p class="text-xs text-on-surface-variant italic">Aún no hay sesiones de voz registradas.</p>
                </ng-template>
              </div>

              <!-- TRANSCRIPCIONES & REGISTRO DE ÓRDENES TABLE -->
              <div class="p-5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-headline-md text-base font-bold text-on-surface">Transcripciones & Registro de Órdenes</h3>
                    <p class="text-xs text-on-surface-variant">Extracción automática de entidades gastronómicas y confianza del modelo de lenguaje.</p>
                  </div>
                  <span class="text-xs font-bold text-primary">Historial en Vivo</span>
                </div>

                <div class="space-y-3">
                  <div
                    *ngFor="let s of metricasService.sesiones()"
                    class="p-4 rounded-xl border border-surface-container bg-surface-container-lowest shadow-xs space-y-3"
                  >
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="reproducirAudio(s)"
                          class="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                          title="Reproducir audio sintetizado"
                        >
                          <span class="material-symbols-outlined text-sm">play_arrow</span>
                        </button>
                        <span class="font-black text-on-surface">{{ s.codigo_llamada }} • {{ s.ubicacion }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span>{{ s.fecha }} {{ s.hora }}</span>
                        <span *ngIf="s.pedido_asociado_codigo" class="font-bold text-primary">Pedido {{ s.pedido_asociado_codigo }}</span>
                        <span>Duración: {{ s.duracion_segundos }}s</span>
                        <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                          ✓ {{ s.confianza }}% Confianza
                        </span>
                      </div>
                    </div>

                    <div class="p-3 rounded-lg bg-surface-container-low text-xs space-y-2">
                      <p class="italic text-on-surface">
                        "{{ s.transcripcion_usuario }}"
                      </p>
                      
                      <div class="pt-2 border-t border-surface-container flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div>
                          <span class="font-bold text-on-surface-variant">Platos identificados: </span>
                          <strong class="text-primary">{{ s.platos_identificados.length ? s.platos_identificados.join(', ') : 'Ninguno (aclaración)' }}</strong>
                        </div>
                        <div *ngIf="s.modificadores_jerga && s.modificadores_jerga.length > 0">
                          <span class="font-bold text-on-surface-variant">Jerga detectada: </span>
                          <span class="px-1.5 py-0.5 rounded bg-secondary-container/50 text-on-secondary-container font-semibold">
                            {{ s.modificadores_jerga.join(', ') }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: Slang, Dishes & Upsell Effectiveness -->
            <div class="space-y-6">
              
              <!-- PLATOS MÁS PEDIDOS POR VOZ -->
              <div class="p-5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-md text-base font-bold text-on-surface">Platos más Pedidos por Voz</h3>
                  <span class="text-[11px] text-on-surface-variant font-bold">Unidades</span>
                </div>
                <div class="space-y-3">
                  <p *ngIf="metricasService.platosMasPedidosVoz().length === 0" class="text-xs text-on-surface-variant italic">
                    Aún no hay pedidos registrados por voz.
                  </p>
                  <div *ngFor="let p of metricasService.platosMasPedidosVoz()" class="space-y-1">
                    <div class="flex justify-between text-xs font-semibold">
                      <span class="text-on-surface">{{ p.nombre }}</span>
                      <span class="text-on-surface-variant">{{ p.porcentaje }}% ({{ p.cantidad }} und.)</span>
                    </div>
                    <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div class="bg-primary h-full rounded-full" [style.width]="p.porcentaje + '%'"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- MODIFICADORES Y JERGA CHIFA -->
              <div class="p-5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
                <div>
                  <h3 class="font-headline-md text-base font-bold text-on-surface">Modificadores y Jerga Chifa</h3>
                  <p class="text-xs text-on-surface-variant mt-0.5">Detectados por Mei en las sesiones registradas.</p>
                </div>
                <p *ngIf="metricasService.jergaFrecuente().length === 0" class="text-xs text-on-surface-variant italic">
                  Sin modificadores detectados todavía.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div *ngFor="let j of metricasService.jergaFrecuente()" class="p-2.5 rounded-xl bg-surface-container-low border border-surface-container space-y-0.5">
                    <div class="flex justify-between items-center gap-2">
                      <span class="font-black text-primary">{{ j.termino }}</span>
                      <span class="text-[10px] font-mono font-bold text-on-surface-variant">{{ j.frecuencia }}x</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PEDIDOS POR CANAL -->
              <div class="p-5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-md text-base font-bold text-on-surface">Pedidos por Canal</h3>
                  <span class="text-[11px] text-on-surface-variant font-bold">Sin cancelados</span>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let c of metricasService.pedidosPorCanal()" class="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1 text-xs">
                    <div class="flex justify-between items-center font-bold">
                      <span class="text-on-surface">{{ c.canal }}</span>
                      <span class="text-emerald-700">{{ c.porcentaje }}%</span>
                    </div>
                    <div class="flex justify-between text-[11px] text-on-surface-variant">
                      <span>{{ c.pedidos }} pedidos</span>
                      <span class="font-bold text-on-surface">S/ {{ c.ingresos.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  `
})
export class AdminMetricasComponent {
  readonly pedidosVigentes = computed(() =>
    this.pedidosService.pedidos().filter(p => p.estado !== 'cancelado').length
  );

  constructor(
    public metricasService: MetricasService,
    private pedidosService: PedidosService,
    private productosService: ProductosService,
    private voice: VoiceAiService,
    private notification: NotificationService,
    private router: Router
  ) {}

  reproducirAudio(s: SesionVoz): void {
    this.voice.speak(s.transcripcion_usuario);
    this.notification.info('Reproduciendo transcripción', `Lectura en voz alta de ${s.codigo_llamada}.`);
  }

  /** Exporta las sesiones de voz registradas a CSV. */
  descargarReporte(): void {
    const sesiones = this.metricasService.sesiones();
    if (sesiones.length === 0) {
      this.notification.warning('Sin datos', 'Aún no hay sesiones de voz para exportar.');
      return;
    }
    descargarCsv(`chifawok-sesiones-voz-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Código', 'Fecha', 'Hora', 'Comensal', 'Canal', 'Transcripción', 'Platos identificados', 'Confianza (%)', 'Duración (s)', 'Pedido', 'Estado'],
      ...sesiones.map(s => [
        s.codigo_llamada, s.fecha, s.hora, s.cliente_nombre, s.ubicacion, s.transcripcion_usuario,
        s.platos_identificados.join(', '), s.confianza, s.duracion_segundos, s.pedido_asociado_codigo || '', s.estado
      ])
    ]);
    this.notification.success('Reporte descargado', `${sesiones.length} sesiones de voz exportadas a CSV.`);
  }

  /** El vocabulario de Mei son los nombres y sinónimos de voz de cada plato. */
  configurarVocabulario(): void {
    const terminos = this.productosService.productos()
      .reduce((n, p) => n + 1 + (p.sinonimos_voz || []).length, 0);
    this.notification.info(
      'Vocabulario de Mei',
      `Mei reconoce ${terminos} términos (nombres y sinónimos de voz). Edítalos en cada plato de Gestión de Productos.`
    );
    this.router.navigate(['/admin/productos']);
  }
}
