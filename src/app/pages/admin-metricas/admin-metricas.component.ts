import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { MetricasService } from '../../services/metricas.service';
import { VoiceAiService } from '../../services/voice-ai.service';
import { NotificationService } from '../../services/notification.service';
import { SesionVoz } from '../../models/sesion-voz.model';

@Component({
  selector: 'app-admin-metricas',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <app-admin-sidebar></app-admin-sidebar>

      <main class="flex-1 flex flex-col h-screen overflow-y-auto bg-background custom-scroll">
        
        <!-- Header (Matches Stitch screen) -->
        <header class="bg-surface border-b border-outline-variant/30 px-8 py-5 sticky top-0 z-20 shadow-xs">
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
                <span>Descargar Reporte</span>
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

        <div class="p-8 space-y-6 max-w-[1440px] w-full">
          
          <!-- TOP 4 KPI CARDS (Matches Stitch) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Precisión Fonética Wok</span>
                <span class="material-symbols-outlined text-primary text-lg">graphic_eq</span>
              </div>
              <p class="font-display-lg text-3xl font-black text-on-surface">98.4%</p>
              <span class="text-[10px] text-emerald-700 font-bold block">
                ↗ +1.2% vs promedio en ruido de cocina
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Tiempo Promedio de Orden</span>
                <span class="material-symbols-outlined text-secondary text-lg">timer</span>
              </div>
              <p class="font-display-lg text-3xl font-black text-on-surface">42 seg</p>
              <span class="text-[10px] text-emerald-700 font-bold block">
                ⚡ 5x más rápido que llamada tradicional (3.5 min)
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Upselling Exitoso</span>
                <span class="material-symbols-outlined text-tertiary text-lg">shopping_cart_checkout</span>
              </div>
              <p class="font-display-lg text-3xl font-black text-on-surface">34.2%</p>
              <span class="text-[10px] text-emerald-700 font-bold block">
                ↗ +8.4% wantán, bebidas y porción extra
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-1">
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span class="font-bold uppercase tracking-wider text-[11px]">Llamadas Simultáneas</span>
                <span class="material-symbols-outlined text-emerald-600 text-lg">call</span>
              </div>
              <div class="flex items-baseline gap-2">
                <p class="font-display-lg text-3xl font-black text-emerald-700">6 activas</p>
                <span class="text-xs text-on-surface-variant">/ 184 hoy</span>
              </div>
              <span class="text-[10px] text-on-surface-variant font-medium block">
                0 llamadas perdidas en espera
              </span>
            </div>

          </div>

          <!-- 2-COLUMN MAIN LAYOUT -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- LEFT 2 COLUMNS: Active Live Call & Transcriptions -->
            <div class="lg:col-span-2 space-y-6">
              
              <!-- ACTIVE LIVE CALL CARD (Matches Stitch screen) -->
              <div class="p-5 rounded-2xl bg-surface border-2 border-primary/30 shadow-xs space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-3">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                    <span class="font-display-lg text-base font-black text-on-surface">Llamada en Curso #CW-928</span>
                    <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      Mesa 4 & Delivery
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs">
                    <span class="font-mono font-bold text-primary">00:38 / Live</span>
                    <span class="text-emerald-700 font-bold">Confianza: 99.1%</span>
                  </div>
                </div>

                <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
                  <div class="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span class="flex items-center gap-1 font-semibold">
                      <span class="material-symbols-outlined text-xs text-primary">sound_detection_loud_sound</span>
                      Captura Acústica de Voz + Cancelación Wok Sizzle (42dB)
                    </span>
                    <span class="font-mono text-emerald-700 font-bold">FILTRO ACTIVO</span>
                  </div>

                  <p class="text-xs text-on-surface font-medium italic leading-relaxed">
                    <strong>Cliente en vivo:</strong> "...y también agrégale una porción de wantán frito bien doradito con su tamarindo por favor..."
                  </p>
                </div>
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
                        <span>{{ s.hace_tiempo }}</span>
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
                          <strong class="text-primary">{{ s.platos_identificados.join(', ') }}</strong>
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
                  <span class="text-[11px] text-on-surface-variant font-bold">Turno Hoy</span>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let p of dashboard.platos_mas_pedidos_voz" class="space-y-1">
                    <div class="flex justify-between text-xs font-semibold">
                      <span class="text-on-surface">{{ p.nombre }}</span>
                      <span class="text-on-surface-variant">{{ p.porcentaje }}% ({{ p.pedidos }} ped.)</span>
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
                  <p class="text-xs text-on-surface-variant mt-0.5">Reconocimiento léxico peruano adaptado al Wok.</p>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div *ngFor="let j of dashboard.jerga_chifa_frecuente" class="p-2.5 rounded-xl bg-surface-container-low border border-surface-container space-y-0.5">
                    <div class="flex justify-between items-center">
                      <span class="font-black text-primary">"{{ j.termino }}"</span>
                      <span class="text-[10px] font-mono font-bold text-on-surface-variant">{{ j.frecuencia }}x</span>
                    </div>
                    <p class="text-[10px] text-on-surface-variant leading-tight">{{ j.significado }}</p>
                  </div>
                </div>
              </div>

              <!-- EFECTIVIDAD DE RECOMENDACIONES (UPSELL) -->
              <div class="p-5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-md text-base font-bold text-on-surface">Efectividad de Recomendaciones</h3>
                  <span class="text-[11px] text-emerald-700 font-black">+S/ 2,168.00 hoy</span>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let rec of dashboard.efectividad_recomendaciones" class="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1 text-xs">
                    <div class="flex justify-between items-center font-bold">
                      <span class="text-on-surface">{{ rec.producto }}</span>
                      <span class="text-emerald-700">{{ rec.porcentaje }}%</span>
                    </div>
                    <div class="flex justify-between text-[11px] text-on-surface-variant">
                      <span>{{ rec.sugerencias }} sugerencias • {{ rec.aceptadas }} aceptadas</span>
                      <span class="font-bold text-on-surface">+S/ {{ rec.ingreso_adicional.toFixed(2) }}</span>
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
  dashboard!: ReturnType<MetricasService['getDashboardData']>;

  constructor(
    public metricasService: MetricasService,
    private voice: VoiceAiService,
    private notification: NotificationService
  ) {
    this.dashboard = this.metricasService.getDashboardData();
  }

  reproducirAudio(s: SesionVoz): void {
    this.voice.speak(s.transcripcion_usuario);
    this.notification.info('Reproduciendo Voz', `Sintetizando audio para ${s.codigo_llamada}`);
  }

  descargarReporte(): void {
    this.notification.success('Reporte Generado', 'Métricas de Voice AI exportadas a PDF.');
  }

  configurarVocabulario(): void {
    this.notification.info('Vocabulario Wok', 'Diccionario fonético actualizado con 124 términos chiferos.');
  }
}
