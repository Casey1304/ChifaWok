import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { StorageService } from '../../services/storage.service';
import { VoiceAiService } from '../../services/voice-ai.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  template: `
    <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      <app-admin-sidebar></app-admin-sidebar>

      <main class="flex-1 min-h-0 min-w-0 flex flex-col lg:h-screen overflow-y-auto bg-background custom-scroll">
        
        <!-- Header -->
        <header class="bg-surface border-b border-outline-variant/30 px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-20 shadow-xs">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-primary">Arquitectura & Conectividad</span>
            <h1 class="font-display-lg text-2xl font-black text-on-surface mt-0.5">
              Configuración del Sistema e Integración Backend
            </h1>
          </div>
        </header>

        <div class="p-4 sm:p-8 space-y-6 max-w-4xl w-full">
          
          <!-- Mode Status Card -->
          <div class="p-6 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 class="font-bold text-sm text-amber-950 uppercase tracking-wider">
                  Modo Activo: Demostración Funcional con Persistencia Local
                </h3>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                Modo Autónomo
              </span>
            </div>

            <p class="text-xs text-amber-900 leading-relaxed">
              Actualmente no se detectó una instancia de backend Java Spring Boot en ejecución en este equipo. La aplicación está operando en <strong>Modo Demostración</strong>, permitiendo registrar pedidos, editar platillos en la carta, gestionar clientes, simular transiciones de cocina y dialogar con Mei mediante la Web Speech API nativa, con persistencia garantizada en LocalStorage.
            </p>
          </div>

          <!-- Backend API Endpoints Configuration Form -->
          <div class="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-5">
            <div class="border-b border-surface-container pb-3">
              <h2 class="font-headline-md text-base font-bold text-on-surface">Servicios y Endpoints Microservicios</h2>
              <p class="text-xs text-on-surface-variant">
                Configura las URL base de los microservicios definidos en el informe de arquitectura del proyecto.
              </p>
            </div>

            <div class="space-y-4 text-xs">
              <!-- Spring Boot Endpoint -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="font-bold text-on-surface flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-primary">dns</span>
                    Orquestador Central Java 17 / Spring Boot 3.3.5
                  </label>
                  <span class="text-[10px] text-on-surface-variant font-mono">REST API • JWT HS256</span>
                </div>
                <input
                  type="text"
                  [(ngModel)]="springBootUrl"
                  class="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low"
                />
                <p class="text-[11px] text-on-surface-variant">
                  Endpoints esperados: <code>/api/v1/auth/login</code>, <code>/api/v1/pedidos</code>, <code>/api/v1/productos</code>, <code>/api/v1/voice/transcribir</code>.
                </p>
              </div>

              <!-- FastAPI Python Microservice -->
              <div class="space-y-1.5 pt-2">
                <div class="flex items-center justify-between">
                  <label class="font-bold text-on-surface flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-tertiary">psychology</span>
                    Motor de Inteligencia Artificial (Python 3.12 / FastAPI + LangChain)
                  </label>
                  <span class="text-[10px] text-on-surface-variant font-mono">LLM gpt-4o-mini / Anthropic</span>
                </div>
                <input
                  type="text"
                  [(ngModel)]="fastApiUrl"
                  class="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low"
                />
                <p class="text-[11px] text-on-surface-variant">
                  Consumo intermediado por Spring Boot WebClient para aislamiento de carga computacional.
                </p>
              </div>

              <!-- Test Connectivity Button -->
              <div class="pt-3 flex items-center gap-3">
                <button
                  (click)="testConectividad()"
                  [disabled]="isTesting()"
                  class="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-surface-tint shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span class="material-symbols-outlined text-base">sensors</span>
                  <span>{{ isTesting() ? 'Probando conexión...' : 'Probar Conectividad con Backend' }}</span>
                </button>

                <span *ngIf="resultadoTest()" class="text-xs font-bold" [ngClass]="resultadoExito() ? 'text-emerald-700' : 'text-amber-800'">
                  {{ resultadoTest() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Web Speech API Browser Status -->
          <div class="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs space-y-4">
            <h2 class="font-headline-md text-base font-bold text-on-surface">Estado de la Web Speech API en este Navegador</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-on-surface">SpeechRecognition (STT)</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="voice.isBrowserSupported() ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'">
                    {{ voice.isBrowserSupported() ? '✓ Soportado' : '✗ No disponible' }}
                  </span>
                </div>
                <p class="text-[11px] text-on-surface-variant">Configurado para dialecto peruano <code>es-PE</code>.</p>
              </div>

              <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-on-surface">SpeechSynthesis (TTS)</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="ttsSoportado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'">
                    {{ ttsSoportado ? '✓ Soportado' : '✗ No disponible' }}
                  </span>
                </div>
                <p class="text-[11px] text-on-surface-variant">Confirmación auditiva hablada para las respuestas de Mei.</p>
              </div>
            </div>

            <!-- Voz de Mei -->
            <div *ngIf="ttsSoportado" class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-2.5 text-xs">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-bold text-on-surface">Voz de Mei</span>
                <span *ngIf="voice.vozActual() as v" class="text-[11px] text-on-surface-variant">
                  En uso: <strong class="text-on-surface">{{ v.nombre }}</strong> ({{ v.idioma }}, {{ v.genero }})
                </span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2">
                <select
                  [ngModel]="vozElegida"
                  (ngModelChange)="cambiarVoz($event)"
                  aria-label="Voz de Mei"
                  class="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl border border-outline-variant bg-surface"
                >
                  <option value="">Automática (femenina en español latinoamericano)</option>
                  <option *ngFor="let v of voice.vocesDisponibles()" [value]="v.voiceURI || v.name">
                    {{ v.name }} · {{ v.lang }}
                  </option>
                </select>
                <button
                  type="button"
                  (click)="probarVoz()"
                  class="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-base">{{ voice.isSpeaking() ? 'stop_circle' : 'record_voice_over' }}</span>
                  {{ voice.isSpeaking() ? 'Detener' : 'Probar voz' }}
                </button>
              </div>
              <p *ngIf="voice.vocesDisponibles().length === 0" class="text-[11px] text-amber-800">
                El navegador no informa voces en español: Mei usará la voz predeterminada del sistema.
              </p>
              <p class="text-[11px] text-on-surface-variant">
                Las voces dependen del navegador y de Windows. Microsoft Edge ofrece voces naturales (por ejemplo, Camila o Dalia).
              </p>
            </div>
          </div>

          <!-- Reset demo data -->
          <div class="p-6 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex items-center justify-between">
            <div>
              <h3 class="font-headline-md text-sm font-bold text-on-surface">Restablecer Información de Demostración</h3>
              <p class="text-xs text-on-surface-variant">Restaura la carta, las comandas activas y los clientes a sus valores iniciales.</p>
            </div>
            <button
              (click)="resetDemo()"
              class="px-4 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
            >
              Reiniciar Todo
            </button>
          </div>

        </div>

      </main>

    </div>
  `
})
export class AdminConfiguracionComponent {
  private readonly URLS_KEY = 'config_backend_urls';

  springBootUrl = 'http://localhost:8080/api/v1';
  fastApiUrl = 'http://localhost:8000';

  readonly ttsSoportado = typeof window !== 'undefined' && 'speechSynthesis' in window;
  readonly isTesting = signal<boolean>(false);
  readonly resultadoTest = signal<string | null>(null);
  readonly resultadoExito = signal<boolean>(false);

  constructor(
    public voice: VoiceAiService,
    private storage: StorageService,
    private notification: NotificationService
  ) {
    const guardadas = this.storage.get<{ springBootUrl?: string; fastApiUrl?: string } | null>(this.URLS_KEY, null);
    if (guardadas?.springBootUrl) this.springBootUrl = guardadas.springBootUrl;
    if (guardadas?.fastApiUrl) this.fastApiUrl = guardadas.fastApiUrl;
  }

  /** URI de la voz preferida ('' = automática). */
  get vozElegida(): string {
    return this.storage.get<string | null>('voz_mei', null) ?? '';
  }

  cambiarVoz(uri: string): void {
    this.voice.setVozPreferida(uri || null);
    this.probarVoz();
  }

  probarVoz(): void {
    if (this.voice.isSpeaking()) {
      this.voice.stopSpeaking();
      return;
    }
    this.voice.speak('¡Hola! Soy Mei. Te recomiendo el Pollo Tipa Kay, un Arroz Chaufa Especial con Wantán Frito y una Inka Kola bien helada. Tu pedido suma S/ 75.00.');
  }

  /**
   * Intenta contactar realmente la URL configurada (timeout de 3 s).
   * Este frontend aún no consume esa API: los datos siguen en LocalStorage.
   */
  async testConectividad(): Promise<void> {
    const url = this.springBootUrl.trim();
    this.storage.set(this.URLS_KEY, { springBootUrl: url, fastApiUrl: this.fastApiUrl.trim() });
    this.isTesting.set(true);
    this.resultadoTest.set(null);

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 3000);
    try {
      await fetch(url, { mode: 'no-cors', signal: controlador.signal, cache: 'no-store' });
      this.resultadoExito.set(true);
      this.resultadoTest.set(`El servidor respondió en ${url}. La aplicación sigue usando LocalStorage: la integración REST aún no está implementada en el frontend.`);
      this.notification.success('Servidor alcanzable', 'Se obtuvo respuesta del backend configurado.');
    } catch {
      this.resultadoExito.set(false);
      this.resultadoTest.set(`Sin respuesta de ${url}. La aplicación funciona en modo demostración con LocalStorage.`);
      this.notification.info('Backend no disponible', 'Modo demostración activo con datos locales.');
    } finally {
      clearTimeout(temporizador);
      this.isTesting.set(false);
    }
  }

  resetDemo(): void {
    if (confirm('¿Restablecer todos los datos a la configuración inicial de Chifa Wok?')) {
      this.storage.resetAll();
      this.notification.success('Datos Restablecidos', 'Se recargará la aplicación.');
      setTimeout(() => window.location.reload(), 400);
    }
  }
}
